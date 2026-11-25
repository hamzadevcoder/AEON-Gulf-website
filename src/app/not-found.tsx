import './globals.css';

export const metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <section className="section tone-white notfound">
      <p className="eyebrow">Page not found</p>
      <h1 className="h-hero">
        This page is not here.
        <br />
        <span className="tone-2">It may have moved.</span>
      </h1>
      <a className="btn btn--ice" href="/">
        <span className="roll" aria-hidden="true">
          <span>Back to home</span>
          <span>Back to home</span>
        </span>
        <span className="sr-only">Back to home</span>
      </a>
    </section>
  );
}
