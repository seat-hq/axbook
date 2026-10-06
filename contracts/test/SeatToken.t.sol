// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {SeatToken} from "../src/SeatToken.sol";

contract SeatTokenTest is Test {
    function test_MintsFixedSupplyToHolder() public {
        address holder = makeAddr("holder");
        SeatToken token = new SeatToken(holder);
        assertEq(token.name(), "Axbook");
        assertEq(token.symbol(), "AXBOOK");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 1_000_000_000 ether);
        assertEq(token.MAX_SUPPLY(), 1_000_000_000 ether);
        assertEq(token.balanceOf(holder), 1_000_000_000 ether);
    }

    function test_ZeroHolder_Reverts() public {
        vm.expectRevert("holder=0");
        new SeatToken(address(0));
    }

    function test_NoMintFunction() public {
        SeatToken token = new SeatToken(address(this));
        // Transfer works; there is no public mint.
        token.transfer(makeAddr("bob"), 1 ether);
        assertEq(token.totalSupply(), 1_000_000_000 ether);
    }
}
