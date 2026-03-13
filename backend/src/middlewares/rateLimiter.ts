import rateLimit from 'express-rate-limit';

export const generateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour reset time
    max: 10,
    message: { error: "You've reached the maximum number of generations for this hour. Please take a break and try again later!" },
    standardHeaders: true,
    legacyHeaders: false,
});

export const translateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes reset time
    max: 20,
    message: { error: "Too many translation requests. Please wait a few minutes." },
});