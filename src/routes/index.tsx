import { createFileRoute } from "@tanstack/react-router";
import hero from "@/assets/spa-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spa Studio — Massage, Facials & Rituals of Calm" },
      { name: "description", content: "Spa Studio offers massages, facials and body rituals in a quiet, natural space." },
      { property: "og:title", content: "Spa Studio — Rituals of Calm" },
      { property: "og:description", content: "Massages, facials and body rituals in a quiet, natural space." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const services = [
  { name: "Signature Massage", time: "60 min", price: "$90", desc: "Warm oils and slow, deep pressure to release tension." },
  { name: "Botanical Facial", time: "50 min", price: "$80", desc: "Cleansing, gentle exfoliation and a nourishing plant mask." },
  { name: "Hot Stone Ritual", time: "75 min", price: "$110", desc: "Heated basalt stones melt away stiffness and stress." },
  { name: "Body Polish & Wrap", time: "60 min", price: "$95", desc: "Sea-salt scrub followed by a hydrating clay wrap." },
];

function Index() {
  return (
    <main className="font-sans">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl tracking-wide">Spa Studio</span>
        <a href="#book" className="text-sm uppercase tracking-[0.2em] text-primary">Book</a>
      </header>
      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">Rituals of calm</p>
          <h1 className="font-display text-6xl leading-[1.05] md:text-7xl">Slow down.<br /><em className="text-primary">Breathe in.</em></h1>
          <p className="mt-6 max-w-md text-muted-foreground">A quiet studio for massage, skincare and restorative body rituals.</p>
          <a href="#book" className="mt-8 inline-block rounded-sm bg-primary px-8 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90">Reserve a visit</a>
        </div>
        <img src={hero} alt="Calm spa interior with stone basin and eucalyptus" className="aspect-[4/5] w-full rounded-sm object-cover" width={1600} height={1000} />
      </section>
      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-4xl">Treatments</h2>
          <div className="mt-10 grid gap-px bg-border md:grid-cols-2">
            {services.map((s) => (
              <div key={s.name} className="bg-card p-8">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl">{s.name}</h3>
                  <span className="text-accent-foreground">{s.price}</span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.time}</p>
                <p className="mt-4 text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="book" className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="font-display text-5xl">Your moment awaits</h2>
        <p className="mt-4 text-muted-foreground">Open daily, 9am – 8pm · hello@spastudio.com · (555) 010-2030</p>
        <a href="mailto:hello@spastudio.com" className="mt-8 inline-block rounded-sm border border-primary px-8 py-3 text-sm uppercase tracking-[0.2em] text-primary transition hover:bg-primary hover:text-primary-foreground">Book by email</a>
      </section>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">© 2026 Spa Studio</footer>
    </main>
  );
}
