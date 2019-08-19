const Token = artifacts.require("Token");
const TokenSale = artifacts.require("TokenSale");

module.exports = function(deployer) {
	deployer.deploy(Token, 1000000).then(() => {
		// Token price is 0.001 Ether
		let tokenPrice = 1000000000000000;
		return deployer.deploy(TokenSale, Token.address, tokenPrice);
	});
};