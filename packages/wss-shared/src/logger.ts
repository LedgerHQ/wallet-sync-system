/* eslint-disable turbo/no-undeclared-env-vars */
import winston from "winston";

const transports: winston.transport[] = [];

transports.push(
  new winston.transports.File({ filename: "error.log", level: "error" }),
  new winston.transports.File({ filename: "combined.log" })
);

if (process.env.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: "HH:mm:ss",
        }),
        winston.format.printf(
          ({ level, message, timestamp }) =>
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `[${timestamp}] ${level}: ${message}`
        )
      ),
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  defaultMeta: { service: "wallet-sync-system" },
  transports,
});
