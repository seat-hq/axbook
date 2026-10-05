// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Burns the broadcaster's own balance of a pons.family launch token.
///         PonsLauncherToken has no burn(). Pons counts the dead-address
///         balance as burned supply, so this transfers there.
///         The factory locks the launch liquidity. This cannot pull it out.
///         Refuses unless CONFIRM_BURN=I_UNDERSTAND.
contract BurnLaunchToken is Script {
    /// @dev Canonical burn address. Transfers here stay in totalSupply and
    ///      leave circulation. Matches the address pons uses for burned supply.
    address internal constant DEAD = 0x000000000000000000000000000000000000dEaD;
    uint256 internal constant RH_MAINNET = 4663;

    function run() external {
        require(
            keccak256(bytes(vm.envOr("CONFIRM_BURN", string("")))) == keccak256(bytes("I_UNDERSTAND")),
            "refusing: set CONFIRM_BURN=I_UNDERSTAND"
        );
        require(block.chainid == RH_MAINNET, "not Robinhood mainnet");

        address token = vm.envAddress("LAUNCH_TOKEN");
        require(token != address(0) && token != DEAD, "LAUNCH_TOKEN");

        uint256 whole = vm.envOr("BURN_AMOUNT", uint256(0));
        uint256 raw = vm.envOr("BURN_WEI", uint256(0));
        require(whole == 0 || raw == 0, "set BURN_AMOUNT or BURN_WEI, not both");

        uint256 balance = IERC20(token).balanceOf(msg.sender);
        uint256 amount = raw != 0 ? raw : whole != 0 ? whole * 1 ether : balance;
        require(amount > 0, "nothing to burn");
        require(amount <= balance, "balance too small");

        console2.log("token", token);
        console2.log("from", msg.sender);
        console2.log("amount", amount);
        console2.log("dead", DEAD);

        vm.startBroadcast();
        require(IERC20(token).transfer(DEAD, amount), "transfer failed");
        vm.stopBroadcast();
    }
}
