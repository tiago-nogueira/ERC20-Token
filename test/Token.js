var Token = artifacts.require("./Token.sol");

contract("Token", accounts => {
	var tokenInstance;

	it("initializes with the correct values", () => {
		return Token.deployed().then(instance => {
			tokenInstance = instance;
			return tokenInstance.name();
		}).then(name => {
			assert.equal(name, "TucoCoin", "Correct token name");
			return tokenInstance.symbol();
		}).then(symbol => {
			assert.equal(symbol, "TCC", "Correct token symbol");
			return tokenInstance.standard();
		}).then(standard => {
			assert.equal(standard, "TucoCoin v1.0", "Correct token standard");
		});
	})

	it("allocates the initial supply upon deployment", () => {
		return Token.deployed().then(instance => {
			tokenInstance = instance;
			return tokenInstance.totalSupply();
		}).then(totalSupply => {
			assert.equal(totalSupply.toNumber(), 1000000, "Correct total supply");
			return tokenInstance.balanceOf(accounts[0]);
		}).then(adminBalance => {
			assert.equal(adminBalance.toNumber(), 1000000, "Inicial supply allocated to admins' account");
		});
	});

	it("tries to access the private variable 'balances'", () => {
		return Token.deployed().then(instance => {
			tokenInstance = instance;
			return tokenInstance.balances(accounts[0]);
		}).then(assert.fail).catch(error => {
			assert(error.name == 'TypeError', "'balanceOf' private");	});
	});

	it("tries to access the private variable 'approvedTransfers'", () => {
		return Token.deployed().then(instance => {
			tokenInstance = instance;
			return tokenInstance.approvedTransfers(accounts[0], accounts[1]);
		}).then(assert.fail).catch(error => {
			assert(error.name == 'TypeError', "'approvedTransfers' must be private");
		});
	});	

	it("transfers token ownership", () => {
		return Token.deployed().then(instance => {
			tokenInstance = instance;
			// Testing the 'require' transfering a value larger than the sender's balance
			return tokenInstance.transfer.call(accounts[1], 99999999999);
		}).then(assert.fail).catch(error => {
			assert(error.message.indexOf("revert") >= 0, "error message must contain 'revert'");
			return tokenInstance.transfer.call(accounts[1], 250000, { from: accounts[0] });
		}).then(success => {
			assert(success, "returns true");
			return tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] });
		}).then(receipt => {
			assert.equal(receipt.logs.length, 1, "triggers one event");
			assert.equal(receipt.logs[0].event, "Transfer", "'Transfer' event");
			assert.equal(receipt.logs[0].args._from, accounts[0], "Correct sender");
			assert.equal(receipt.logs[0].args._to, accounts[1], "Correct receiver");
			assert.equal(receipt.logs[0].args._value, 250000, "Correct value transfered");
			return tokenInstance.balanceOf(accounts[1]);
		}).then(balance => {
			assert.equal(balance.toNumber(), 250000, "tokens received");
			return tokenInstance.balanceOf(accounts[0]);
		}).then(balance => {
			assert.equal(balance.toNumber(), 750000, "tokens deducted");
		});
	});

	it("approves a transaction", () => {
		return Token.deployed().then(instance => {
			tokenInstance = instance;
			return tokenInstance.approve.call(accounts[1], 1000, { from: accounts[0] });
		}).then(success => {
			assert(success, "success");
			return tokenInstance.approve(accounts[1], 1000, { from: accounts[0] });
		}).then(receipt => {
			assert.equal(receipt.logs.length, 1, "triggers one event");
			assert.equal(receipt.logs[0].event, "Approval", "'Approval' event");
			assert.equal(receipt.logs[0].args._owner, accounts[0], "Correct message sender");
			assert.equal(receipt.logs[0].args._spender, accounts[1], "Correct recipient");
			assert.equal(receipt.logs[0].args._value, 1000, "Correct amount");
			return tokenInstance.allowance(accounts[0], accounts[1]);
		}).then(allowance => {
			assert.equal(allowance.toNumber(), 1000, "Correct allowance");
		});
	});

	it("makes an approved transfer", () => {
		return Token.deployed().then(instance => {
			tokenInstance = instance;
			// tries to make an invalid transfer
			return tokenInstance.transferFrom.call(accounts[0], accounts[1], 100000);
		}).then(assert.fail).catch(error => {
			assert(error.message.indexOf('revert') >= 0, "error message must contain 'revert'");
			return tokenInstance.transferFrom.call(accounts[0], accounts[9], 300, { from: accounts[1] });
		}).then(success => {
			return tokenInstance.transferFrom(accounts[0], accounts[9], 300, { from: accounts[1] });
		}).then(receipt => {
			assert.equal(receipt.logs.length, 1, "triggers one event");
			assert.equal(receipt.logs[0].event, "Transfer", "'Transfer' event");
			assert.equal(receipt.logs[0].args._from, accounts[0], "Correct message sender");
			assert.equal(receipt.logs[0].args._to, accounts[9], "Correct recipient");
			assert.equal(receipt.logs[0].args._value, 300, "Correct amount");
			return tokenInstance.allowance(accounts[0], accounts[1]);
		}).then(allowance => {
			assert.equal(allowance.toNumber(), 700, "Correct allowance");
		});
	});

	it("tries to make an approved transfer without funds", () => {
		return Token.deployed().then(instance => {
			tokenInstance = instance;
			// authorizes a transfer
			return tokenInstance.approve(accounts[3], 500, { from: accounts[2] });
		}).then(receipt => {
			assert.equal(receipt.logs.length, 1, "triggers one event");
			assert.equal(receipt.logs[0].event, "Approval", "'Approval' event");
			assert.equal(receipt.logs[0].args._owner, accounts[2], "Correct message sender");
			assert.equal(receipt.logs[0].args._spender, accounts[3], "Correct spender");
			assert.equal(receipt.logs[0].args._value, 500, "Correct amount");
			return tokenInstance.allowance(accounts[2], accounts[3], { from: accounts[2] });
		}).then(allowance => {
			assert.equal(allowance.toNumber(), 500, "Correct allowance");
			// tries to make an invalid transfer
			return tokenInstance.transferFrom.call(accounts[2], accounts[3], 500);
		}).then(assert.fail).catch(error => {
			assert(error.message.indexOf('revert') >= 0, "error message must contain 'revert'");
			return tokenInstance.allowance(accounts[2], accounts[3], { from: accounts[2] });
		}).then(allowance => {
			assert.equal(allowance.toNumber(), 500, "Correct allowance");
			return tokenInstance.balanceOf(accounts[2]);
		}).then(balance => {
			assert.equal(balance.toNumber(), 0, "Correct balance");
			return tokenInstance.balanceOf(accounts[3]);
		}).then(balance => {
			assert.equal(balance.toNumber(), 0, "Correct balance");
		});
	});		 
})