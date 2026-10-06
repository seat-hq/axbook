// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {IRiskModule} from "../src/interfaces/IRiskModule.sol";
import {DeskVault} from "../src/DeskVault.sol";
import {DeskFactory} from "../src/DeskFactory.sol";
import {SwapAdapter} from "../src/SwapAdapter.sol";
import {RiskModule} from "../src/RiskModule.sol";
import {FeeModule} from "../src/FeeModule.sol";
import {ChainlinkOracle} from "../src/ChainlinkOracle.sol";

/// @notice Stops the already-deployed 4663 desk. Pauses the vault, zeros the
///         deposit cap and keeper, pulls the router, clears allowlists, fees,
///         feeds, and the listing bond. Refuses unless CONFIRM_CLOSE=I_UNDERSTAND.
///         SeatToken and StakingPool have no owner, so this cannot shut them.
contract CloseMainnet is Script {
    uint256 internal constant RH_MAINNET = 4663;

    DeskVault internal constant VAULT = DeskVault(0xaaCf1EefD46CF3f763fcf357F925675058adE9fa);
    DeskFactory internal constant FACTORY = DeskFactory(0xe9c66Ecbe674f7481f540371C588A2A1Be0d6261);
    SwapAdapter internal constant SWAP = SwapAdapter(0x8Ff919750a756E903401D4a97F898479fbeFa040);
    RiskModule internal constant RISK = RiskModule(0x4C58691aD3395d9A9fa078B2D86a1C5d90a73e10);
    FeeModule internal constant FEE = FeeModule(0xe31b6764cC9fF92D814A3693f3132538E4227dB6);
    ChainlinkOracle internal constant ORACLE = ChainlinkOracle(0x8600F4D4352d0abFF885Bb17F35C07b7bAA87Bc6);

    address internal constant USDG = 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168;
    address internal constant NVDA = 0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC;
    address internal constant AAPL = 0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9;
    address internal constant SPY = 0x117cc2133c37B721F49dE2A7a74833232B3B4C0C;

    function run() external {
        require(
            keccak256(bytes(vm.envOr("CONFIRM_CLOSE", string("")))) == keccak256(bytes("I_UNDERSTAND")),
            "refusing: set CONFIRM_CLOSE=I_UNDERSTAND"
        );
        require(block.chainid == RH_MAINNET, "not Robinhood mainnet");
        require(VAULT.totalShares() == 0 && VAULT.cashUsdg() == 0, "vault holds funds");
        require(VAULT.withdrawQueueLength() == 0, "withdrawal queue");

        vm.startBroadcast();

        if (!VAULT.paused()) VAULT.pause();
        VAULT.setDepositCap(0);
        VAULT.setKeeper(address(0));

        SWAP.setRouter(address(0));
        SWAP.setAllowedToken(USDG, false);
        SWAP.setAllowedToken(NVDA, false);
        SWAP.setAllowedToken(AAPL, false);
        SWAP.setAllowedToken(SPY, false);

        RISK.setTokenAllowed(address(VAULT), NVDA, false);
        RISK.setTokenAllowed(address(VAULT), AAPL, false);
        RISK.setTokenAllowed(address(VAULT), SPY, false);
        RISK.setSessionRisk(address(VAULT), IRiskModule.Session.Closed, 0);
        RISK.setSessionRisk(address(VAULT), IRiskModule.Session.PreMarket, 0);
        RISK.setSessionRisk(address(VAULT), IRiskModule.Session.Regular, 0);
        RISK.setSessionRisk(address(VAULT), IRiskModule.Session.AfterHours, 0);
        RISK.configureDesk(address(VAULT), 0, 0, 0, 0, 1);

        FEE.setParams(FeeModule.FeeParams({performanceFeeBps: 0, aumFeeBpsPerYear: 0, protocolShareBps: 0, stakerShareBps: 0}));

        ORACLE.setFeed(NVDA, address(0));
        ORACLE.setFeed(AAPL, address(0));
        ORACLE.setFeed(SPY, address(0));

        FACTORY.setListingParams(address(0), 0);

        vm.stopBroadcast();

        console2.log("paused", VAULT.paused());
        console2.log("depositCap", VAULT.depositCapUsdg());
        console2.log("keeper", VAULT.keeper());
        console2.log("router", SWAP.router());
        console2.log("listingBond", FACTORY.listingBondSeat());
    }
}
