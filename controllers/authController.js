import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken = crypto.randomBytes(32).toString("hex");

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            verificationToken
        });

        const verificationLink = `http://localhost:5000/api/auth/verify/${verificationToken}`;

        await sendEmail(
            email,
            "Verify Your Email",
            `<h3>Click below to verify:</h3>
       <a href="${verificationLink}">${verificationLink}</a>`
        );

        res.status(201).json({ message: "User registered. Check email to verify." });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({
            verificationToken: req.params.token
        });

        if (!user)
            return res.status(400).json({ message: "Invalid token" });

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({ message: "Email verified successfully" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "Invalid credentials" });

        if (!user.isVerified)
            return res.status(400).json({ message: "Please verify your email first" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials" });

        res.json({ message: "Login successful" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};