export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: June 2026</p>

        <div className="flex flex-col gap-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">What this app does</h2>
            <p>
              Resumio-AI helps you match your resume against live job listings and suggests portfolio
              projects to strengthen your candidacy. To do this, it processes your resume using
              third-party AI and job search services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Data we collect</h2>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>
                <strong className="text-white">Resume content</strong> — the text extracted from
                the file you upload. This is sent to the third-party services listed below to
                perform analysis and job matching.
              </li>
              <li>
                <strong className="text-white">IP address</strong> — stored temporarily in our
                rate-limiting system (Upstash Redis) to prevent abuse. Not linked to any personal
                profile and expires automatically.
              </li>
              <li>
                <strong className="text-white">Job search queries</strong> — the job titles and
                locations you enter. Sent to job board APIs to retrieve listings.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Third-party services</h2>
            <p className="mb-3">Your resume text is sent to the following services:</p>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>
                <strong className="text-white">Anthropic (Claude)</strong> — scores job
                compatibility and generates portfolio recommendations.{' '}
                <a href="https://www.anthropic.com/privacy" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  Privacy policy
                </a>
              </li>
              <li>
                <strong className="text-white">Voyage AI</strong> — generates semantic embeddings
                used to rank job listings.{' '}
                <a href="https://www.voyageai.com/privacy" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  Privacy policy
                </a>
              </li>
            </ul>
            <p className="mt-3">Job listings are retrieved from:</p>
            <ul className="list-disc pl-5 flex flex-col gap-2 mt-2">
              <li>
                <strong className="text-white">Adzuna</strong> —{' '}
                <a href="https://www.adzuna.com/privacy" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  Privacy policy
                </a>
              </li>
              <li>
                <strong className="text-white">JSearch / RapidAPI</strong> (if enabled) —{' '}
                <a href="https://rapidapi.com/privacy" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  Privacy policy
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Data storage</h2>
            <p>
              We do not store your resume on our servers. Resume text exists only in memory during
              the processing of your request and in your browser session. Once you close or refresh
              the page, it is gone.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Cookies</h2>
            <p>
              This app does not use tracking cookies or analytics. The only server-side state is
              your IP address in the rate-limiting store, which expires automatically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Your rights</h2>
            <p>
              Because we do not store personal data beyond your current session, there is nothing
              to request deletion of. If you have questions about how a third-party service
              handles your data, please refer to their privacy policies linked above.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Contact</h2>
            <p>
              Questions about this policy? Reach out at{' '}
              <a href="mailto:jtsanders87@gmail.com" className="text-indigo-400 hover:underline">
                jtsanders87@gmail.com
              </a>
            </p>
          </section>
        </div>

        <a href="/" className="inline-block mt-12 text-sm text-slate-500 hover:text-white transition-colors">
          ← Back to Resumio-AI
        </a>
      </div>
    </div>
  );
}
