import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import PageHeader from "../components/PageHeader";
import Sparkles from "../components/Sparkles";
import PackageCard from "../components/PackageCard";
import TrustBadges from "../components/TrustBadges";
import { PACKAGES, depositFor, remainingFor } from "../data/packages";
import { TRUST_BADGES } from "../data/site";

export default function Packages() {
  return (
    <>
      <SEO
        title="Princess Party Packages | PrincessDream Coventry"
        description="Browse our magical princess party packages from £100. 30-minute, 1-hour and 2-hour parties — DBS checked entertainers across Coventry & Warwickshire."
        path="/packages"
      />

      <PageHeader
        eyebrow="Party Packages"
        title={
          <>
            Magical <span className="accent-text">Princess Parties</span> for Every Birthday
          </>
        }
        subtitle="Three beautifully crafted packages, each one designed to make your child feel like royalty. Pay a fixed online deposit to secure your date."
      />

      <section className="section-pad bg-white relative overflow-hidden">
        <Sparkles count={30} variant="gold" className="opacity-40" />
        <div className="container-px max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {PACKAGES.map((p, i) => (
              <PackageCard key={p.slug} pkg={p} index={i} />
            ))}
          </div>

          {/* Pricing breakdown table */}
          <div className="mt-16 max-w-3xl mx-auto card-magical p-7 sm:p-10">
            <h2 className="heading-display text-2xl sm:text-3xl text-center">
              Deposit & Balance at a Glance
            </h2>
            <div className="accent-hr mt-4" />
            <p className="text-center text-inkSoft mt-4">
              We make payment effortless: your online deposit secures your booking, and the
              remainder is paid in cash on the day of the party.
            </p>
            <div className="overflow-x-auto mt-8">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-xs uppercase font-cinzel tracking-widest text-pinkDeep">
                    <th className="px-4 py-2">Package</th>
                    <th className="px-4 py-2">Total</th>
                    <th className="px-4 py-2">Deposit (online)</th>
                    <th className="px-4 py-2">Balance on day</th>
                  </tr>
                </thead>
                <tbody>
                  {PACKAGES.map((p) => (
                    <tr key={p.slug} className="bg-pinkSoft/30 rounded-xl">
                      <td className="px-4 py-3 rounded-l-xl font-medium">{p.name}</td>
                      <td className="px-4 py-3">£{p.price}</td>
                      <td className="px-4 py-3 text-pinkDeep font-semibold">
                        £{depositFor(p)}
                      </td>
                      <td className="px-4 py-3 rounded-r-xl">£{remainingFor(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-14 text-center">
            <TrustBadges items={TRUST_BADGES} />
            <div className="mt-10">
              <Link to="/book" className="btn-primary text-base">
                Book Your Magical Party
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
