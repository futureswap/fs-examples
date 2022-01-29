// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFutureswap {
    function stableToken() external view returns(address);
    function assetToken() external view returns(address);

    function changePosition(
        int256 deltaAsset,
        int256 deltaStable,
        int256 stableBound
    ) external;

    function getPosition(address trader)
        external
        view
        returns (
            int256,
            int256,
            uint8,
            uint32
        );
}

contract SimpleTrader is Ownable {
    IERC20 public immutable stableToken;
    IFutureswap public immutable exchange;

    constructor(address exchange_) {
        exchange = IFutureswap(exchange_);
        stableToken = IERC20(exchange.stableToken());
    }

    function approveStable(uint256 amount) public onlyOwner {
        stableToken.approve(address(exchange), amount);
    }

    function changePosition(
        int256 deltaAsset,
        int256 deltaStable,
        int256 stableBound
    ) public onlyOwner {
        exchange.changePosition(deltaAsset, deltaStable, stableBound);
    }

    function withdrawStable(uint256 amount) public onlyOwner {
        stableToken.transfer(msg.sender, amount);
    }
}
