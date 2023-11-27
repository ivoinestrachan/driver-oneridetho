import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "DriverCredentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        if (!credentials || !credentials.email || !credentials.password) {
          throw new Error("Email and password are required");
        }

        const driver = await prisma.driver.findUnique({
          where: { email: credentials.email },
        });

        if (driver && credentials.password === driver.password) {
          return { id: driver.id.toString(), email: driver.email };
        } else {
          throw new Error("Invalid email or password");
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.id) {
        const driver = await prisma.driver.findUnique({
          where: { id: parseInt(token.id as string) },
        });

        if (driver) {
          session.user = {
            //@ts-ignore
            id: driver.id.toString(),
            email: driver.email
          };
        }
      }
    
      return session;
    },
  },
});
