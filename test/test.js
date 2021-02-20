const { expect } = require("chai");

describe("Perpetual Limit Orders:", function() {

    beforeEach(async function() {
    [owner,addr1] = await ethers.getSigners()
  })

  describe("Deployment", function() {

    it("Limit Order Book deployed", async function() {
      let LOB = await ethers.getContractFactory("LimitOrderBook");
      lob = await LOB.deploy()
      await lob.deployed()
    })

    it("Proxy factory deployed", async function() {
      let PF = await ethers.getContractFactory("SmartWalletFactory");
      pf = await PF.deploy(lob.address)
      await pf.deployed()
    })

    it("Setting factory address for LOB", async function() {
      await lob.setFactory(pf.address)
      expect(await lob.factory()).to.equal(pf.address)
    })

  })

  describe("Creating SmartWallet contract", function() {

    it("Spawning new SmartWallet", async function() {
      await pf.spawn()
    })

    it("Logging address", async function() {
      proxy = await pf.getSmartWallet(owner.address)
    })

    it("Checking SmartWallet address", async function() {
      checkpx = await ethers.getContractAt('SmartWallet', proxy)
      expect(await checkpx.owner()).to.equal(owner.address)
    })

    it("Shouldn't be able to duplicate Smart Wallet contract", async function() {
      await expect(pf.spawn()).to.be.revertedWith('Already has smart wallet');
    })

  })

  describe("Creating Limit Orders", function() {

    describe("Creating Limit Order", function() {

      it("Creating simple limit order", async function() {
        await expect(lob.addLimitOrder(
          '0xb397389B61cbF3920d297b4ea1847996eb2ac8E8',
          {d: ethers.utils.parseUnits('30',18)},
          {d: ethers.utils.parseUnits('1',18)},
          {d: ethers.utils.parseUnits('6',18)},
          {d: ethers.utils.parseUnits('5',18)},
          {d: '0'},
          {d: '0'},
          false,
          0
        )).to.not.be.reverted
      })

      it("Checking limit order params", async function() {
        var order = await lob.getLimitOrder(0)
        expect(order.asset).to.equal('0xb397389B61cbF3920d297b4ea1847996eb2ac8E8')
        expect(order.trader).to.equal(owner.address)
        expect(order.orderType).to.equal(1)
        expect(order.reduceOnly).to.equal(false)
        expect(order.expiry).to.equal(0)
        expect(order.limitPrice.d).to.equal(ethers.utils.parseUnits('30',18))
        expect(order.stopPrice.d).to.equal(0)
        expect(order.orderSize.d).to.equal(ethers.utils.parseUnits('1',18))
        expect(order.collateral.d).to.equal(ethers.utils.parseUnits('6',18))
        expect(order.leverage.d).to.equal(ethers.utils.parseUnits('5',18))
        expect(order.slippage.d).to.equal(0)
        expect(order.tipFee.d).to.equal(0)
      })

    })

    describe ("Creating Stop Order", function() {

      it("Creating simple stop order", async function() {
        await expect(lob.addStopOrder(
          '0xb397389B61cbF3920d297b4ea1847996eb2ac8E8',
          {d: '0'},
          {d: '0'},
          {d: '0'},
          {d: '0'},
          {d: '0'},
          {d: '0'}, false, 0
        )).to.not.be.reverted
      })

      it("Checking stop order params", async function() {
        var order = await lob.getLimitOrder(1)
        expect(order.asset).to.equal('0xb397389B61cbF3920d297b4ea1847996eb2ac8E8')
        expect(order.trader).to.equal(owner.address)
        expect(order.orderType).to.equal(2)
        expect(order.reduceOnly).to.equal(false)
        expect(order.expiry).to.equal(0)
        expect(order.limitPrice.d).to.equal(0)
        expect(order.stopPrice.d).to.equal(0)
        expect(order.orderSize.d).to.equal(0)
        expect(order.collateral.d).to.equal(0)
        expect(order.leverage.d).to.equal(0)
        expect(order.slippage.d).to.equal(0)
        expect(order.tipFee.d).to.equal(0)
      })
    })

    describe ("Creating Stop Limit Order", function() {

      it("Creating simple stop limit order", async function() {
        await expect(lob.addStopLimitOrder(
          '0xb397389B61cbF3920d297b4ea1847996eb2ac8E8', {d: '0'}, {d: '0'}, {d: '0'},
          {d: '0'}, {d: '0'}, {d: '0'}, {d: '0'}, false, 0
        )).to.not.be.reverted
      })

      it("Checking stop limit order params", async function() {
        var order = await lob.getLimitOrder(2)
        expect(order.asset).to.equal('0xb397389B61cbF3920d297b4ea1847996eb2ac8E8')
        expect(order.trader).to.equal(owner.address)
        expect(order.orderType).to.equal(3)
        expect(order.reduceOnly).to.equal(false)
        expect(order.expiry).to.equal(0)
        expect(order.limitPrice.d).to.equal(0)
        expect(order.stopPrice.d).to.equal(0)
        expect(order.orderSize.d).to.equal(0)
        expect(order.collateral.d).to.equal(0)
        expect(order.leverage.d).to.equal(0)
        expect(order.slippage.d).to.equal(0)
        expect(order.tipFee.d).to.equal(0)
      })

    })

    describe("Deleting order", function() {

      it("Ensuring that others cannot delete your order", async function() {
        await expect(lob.connect(addr1).deleteOrder(0))
        .to.be.revertedWith('Not your limit order')
      })

      it("Deleting order 0", async function() {
        await expect(lob.deleteOrder(0))
      })

      it("Checking order 0 has been deleted", async function() {
        output = await lob.getLimitOrder(0)
        expect(output.stillValid).to.equal(false)
        expect(output.asset).to.equal('0x0000000000000000000000000000000000000000')
        expect(output.trader).to.equal('0x0000000000000000000000000000000000000000')
        expect(output.orderType).to.equal(0)
        expect(output.reduceOnly).to.equal(false)
        expect(output.expiry).to.equal(0)
        expect(output.limitPrice.d).to.equal(0)
        expect(output.stopPrice.d).to.equal(0)
        expect(output.orderSize.d).to.equal(0)
        expect(output.collateral.d).to.equal(0)
        expect(output.leverage.d).to.equal(0)
        expect(output.slippage.d).to.equal(0)
        expect(output.tipFee.d).to.equal(0)
      })

      it("Checking order 1 hasn't been affected", async function() {
        output = await lob.getLimitOrder(1)
        expect(output.stillValid).to.equal(true)
      })

    })

    describe("Modifying orders", function() {

      it("Ensuring that others cannot modify your order", async function() {
        await expect(lob.connect(addr1).modifyOrder(1, //stop order
          {d: "0"},
          {d: ethers.utils.parseUnits('50000',18)},
          {d: ethers.utils.parseUnits('1', 18)},
          {d: ethers.utils.parseUnits('5000', 18)},
          {d: ethers.utils.parseUnits('10', 18)},
          {d: "0"},
          {d: ethers.utils.parseUnits('1', 18)},
          true,
          100
        )).to.be.revertedWith('Not your limit order')
      })

      it("Modifying order 1", async function(){
        await expect(lob.modifyOrder(1, //stop order
          {d: "0"},
          {d: ethers.utils.parseUnits('50000',18)},
          {d: ethers.utils.parseUnits('1', 18)},
          {d: ethers.utils.parseUnits('5000', 18)},
          {d: ethers.utils.parseUnits('10', 18)},
          {d: "0"},
          {d: ethers.utils.parseUnits('1', 18)},
          true,
          100
        )).to.not.be.reverted
      })

      it("Checking order 1", async function() {
        output = await lob.getLimitOrder(1)
        expect(output.reduceOnly).to.equal(true)
        expect(output.expiry).to.equal(100)
        expect(output.limitPrice.d).to.equal(0)
        expect(output.stopPrice.d).to.equal(ethers.utils.parseUnits('50000',18))
        expect(output.orderSize.d).to.equal(ethers.utils.parseUnits('1',18))
        expect(output.collateral.d).to.equal(ethers.utils.parseUnits('5000',18))
        expect(output.leverage.d).to.equal(ethers.utils.parseUnits('10',18))
        expect(output.slippage.d).to.equal(0)
        expect(output.tipFee.d).to.equal(ethers.utils.parseUnits('1',18))
      })

    })

  })

})
