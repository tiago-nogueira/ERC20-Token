const Token = artifacts.require("./Token.sol");
const TokenSale = artifacts.require("./TokenSale.sol");

contract("TokenSale", accounts => {
	let TokenInstance;
	let TokenSaleInstance;
	let tokenPrice = 1000000000000000; // in wei
	let tokensOffering = 750000;
	let totalSupply = 1000000;

	it("initializes the contract with the correct values", () => {
		return TokenSale.deployed().then(instance => {
			TokenSaleInstance = instance;
			return TokenSaleInstance.address;
		}).then(address => {
			assert.notEqual(address, 0x0, "has contract address");
			return TokenSaleInstance.tokenPrice();
		}).then(price => {
			assert.equal(price, tokenPrice, "has correct token price");
		});
	});

	it("transfers tokens to sell from admin's account", () => {
		return Token.deployed().then(instance => {
			TokenInstance = instance;
			return TokenSale.deployed().then(instance => {
				TokenSaleInstance = instance;
				// Allocating tokens to sell
				return TokenInstance.transfer(TokenSaleInstance.address, tokensOffering, { from: accounts[0] });
			}).then(receipt => {
				assert.equal(receipt.logs.length, 1, "triggers one event");
				assert.equal(receipt.logs[0].event, "Transfer", "'Transfer' event");
				assert.equal(receipt.logs[0].args._from, accounts[0], "Correct sender");
				assert.equal(receipt.logs[0].args._to, TokenSaleInstance.address, "Correct receiver");
				assert.equal(receipt.logs[0].args._value, tokensOffering, "Correct value transfered");
				return TokenInstance.myBalance({ from: TokenSaleInstance.address });
			}).then(balance => {
				assert.equal(balance.toNumber(), tokensOffering, "Correct number of tokens transfered");		
			});
		});
	});

	it("sells tokens correctly", () => {
		let amountOfTokens = 10;
		return Token.deployed().then(instance => {
			TokenInstance = instance;
			return TokenSale.deployed().then(instance => {
				TokenSaleInstance = instance;
				
				// tries to buy tokens without the correct amount of money
				return TokenSaleInstance.buyTokens(amountOfTokens, { from: accounts[0], value: 1});
			}).then(assert.fail).catch(error => {
				assert(error.message.indexOf("revert") >= 0, "error message must contain 'revert'");

				// tries to buy more tokens than the total available
				return TokenSaleInstance.buyTokens(800000, { from: accounts[1], value: 800000 * tokenPrice });
			}).then(assert.fail).catch(error => {
				assert(error.message.indexOf("revert") >= 0, "error message must contain 'revert'");

				// makes a valid transfer
				return TokenSaleInstance.buyTokens(amountOfTokens, { from: accounts[1], value: amountOfTokens * tokenPrice });
			}).then(receipt => {
				assert.equal(receipt.logs.length, 1, "one event triggered");
				assert.equal(receipt.logs[0].event, "Sell", "'Sell' type event");
				assert.equal(receipt.logs[0].args._amountOfTokens, amountOfTokens, "correct amount of tokens sold");
				assert.equal(receipt.logs[0].args._buyer, accounts[1], "correct buyer");
				return TokenSaleInstance.tokensSold();
			}).then(tokensSold => {
				assert.equal(tokensSold.toNumber(), amountOfTokens, "correct total of tokens sold");
				return TokenInstance.myBalance({ from: accounts[1] });
			}).then(balance => {
				assert.equal(balance.toNumber(), amountOfTokens, "correct amount of tokens transfered");
				return TokenInstance.myBalance({ from: TokenSaleInstance.address });
			}).then(balance => {
				assert.equal(balance.toNumber(), tokensOffering - amountOfTokens, "Correct amount of tokens remaining");
			});
		});
	});

	it("ends token sale", () => {
		let amountOfTokens = 10;
		return Token.deployed().then(instance => {
			TokenInstance = instance;
			return TokenSale.deployed().then(instance => {
				TokenSaleInstance = instance;

				// Try to end sales with an account other than admin
				return TokenSaleInstance.endSale({ from: accounts[1] });
			}).then(assert.fail).catch(error => {
				assert(error.message.indexOf("revert") >= 0, "error message must contain 'revert'");

				// End sales
				return TokenSaleInstance.endSale({ from: accounts[0] });
			}).then(receipt => {
				assert.equal(receipt.logs.length, 1, "one event triggered");
				assert.equal(receipt.logs[0].event, "EndSale", "'EndSale' type event");
				assert.equal(receipt.logs[0].args._admin, accounts[0], "admin ended sales");
				return TokenInstance.myBalance({ from: accounts[0] });
			}).then(balance => {
				assert.equal(balance.toNumber(), totalSupply - amountOfTokens, "remaing tokens sent back to admin");
				return TokenInstance.myBalance({ from: TokenSaleInstance.address });
			}).then(balance => {
				assert.equal(balance.toNumber(), 0, "contract doesn't have any tokens");

				// check that contract was destroyed
				return TokenSaleInstance.tokenPrice();
			}).then(assert.fail).catch(error => {
				assert(error.message.indexOf("Returned values aren't valid") >= 0, "variable must be inaccessible")
			})
		});
	});
});