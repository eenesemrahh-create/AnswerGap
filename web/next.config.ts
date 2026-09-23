import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `/terms/en` is a reasonable guess, and it must not become a second address
   * for a document that already has a canonical one. English legal text lives
   * at `/terms` because that is the short, permanent URL handed to Stripe and
   * to the Google Cloud console; a 308 sends the guess there rather than
   * serving the same contract twice.
   */
  async redirects() {
    return [
      { source: "/terms/en", destination: "/terms", permanent: true },
      { source: "/privacy/en", destination: "/privacy", permanent: true },
      { source: "/pricing/en", destination: "/pricing", permanent: true },
      { source: "/solutions/en", destination: "/solutions", permanent: true },
      { source: "/contact/en", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
