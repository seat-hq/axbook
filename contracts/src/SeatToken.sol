// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title SeatToken
/// @notice Fixed-supply $AXBOOK. 1_000_000_000 tokens, 18 decimals, no mint.
///         Constructor mints the whole supply to `initialHolder`. Bucket
///         splits (docs/phase-2.md) are owner transfers after TGE.
contract SeatToken is ERC20 {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 ether;

    constructor(address initialHolder) ERC20("Axbook", "AXBOOK") {
        require(initialHolder != address(0), "holder=0");
        _mint(initialHolder, MAX_SUPPLY);
    }
}
