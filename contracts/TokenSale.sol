pragma solidity 0.5.8;

import "./Token.sol";

contract TokenSale {
	address admin;
	Token public tokenContract;
	uint256 public tokenPrice;
	uint256 public tokensSold;

	constructor(Token _tokenContract, uint256 _tokenPrice) public {
		// Assign an admin
		admin = msg.sender;
		// Token contract
		tokenContract = _tokenContract;
		// Token price
		tokenPrice = _tokenPrice;
	}

	event Sell(
		address _buyer,
		uint256 _amountOfTokens
	);

	event EndSale(address _admin);

	// Safe multiplication
	function multiply (uint256 x, uint256 y) internal pure returns (uint256 z) {
		require(y == 0 || (z = x * y) / y == x);
	}

	// Buying tokens
	function buyTokens(uint256 _amountOfTokens) public payable {
		// Require that value sent is correct
		require(msg.value == multiply(_amountOfTokens, tokenPrice));

		// Require there is enough tokens to sell
		require(tokenContract.balanceOf(address(this)) - tokensSold >= _amountOfTokens);

		// Require that transfer is successful
		require(tokenContract.transfer(msg.sender, _amountOfTokens));

		// Keep track of the total of tokens sold
		tokensSold += _amountOfTokens;

		// Trigger sell event
		emit Sell(msg.sender, _amountOfTokens);
	}

	// Ending tokens sales
	function endSale() public {
		// Require admin
		require(msg.sender == admin);

		// Require remaining tokens are transfered back to admin
		require(tokenContract.transfer(admin, tokenContract.balanceOf(address(this))));

		// Emit EndSale event
		emit EndSale(msg.sender);

		// Destroy contract
		selfdestruct(msg.sender);
	}
}