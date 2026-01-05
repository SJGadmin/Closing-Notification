'use client';

import { useState } from 'react';

interface CheckResult {
  success: boolean;
  clientsChecked?: number;
  notificationsSent?: number;
  matches?: Array<{
    name: string;
    email: string | null;
    closingDate: string;
    daysUntil: number;
  }>;
  error?: string;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/cron');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-900">
      <main className="flex w-full max-w-2xl flex-col gap-8 p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            SISU Closing Notifier
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Manual check for upcoming closings within the next 15 days
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Run Manual Check
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This will check SISU for active clients and send email notifications for any closings within 15 days.
            </p>
          </div>

          <button
            onClick={runCheck}
            disabled={loading}
            className="flex h-12 items-center justify-center rounded-lg bg-blue-600 px-6 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Running Check...' : 'Run Check Now'}
          </button>
        </div>

        {result && (
          <div className={`flex flex-col gap-4 rounded-lg border p-6 ${
            result.success
              ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
              : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {result.success ? '✅' : '❌'}
              </span>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {result.success ? 'Check Complete' : 'Check Failed'}
              </h3>
            </div>

            {result.success ? (
              <div className="flex flex-col gap-3 text-zinc-900 dark:text-zinc-50">
                <div className="flex gap-2">
                  <span className="font-semibold">Clients Checked:</span>
                  <span>{result.clientsChecked || 0}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold">Notifications Sent:</span>
                  <span>{result.notificationsSent || 0}</span>
                </div>

                {result.matches && result.matches.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2">
                    <span className="font-semibold">Matches Found:</span>
                    <div className="flex flex-col gap-2">
                      {result.matches.map((match, idx) => (
                        <div key={idx} className="rounded border border-zinc-300 bg-white p-3 dark:border-zinc-600 dark:bg-zinc-800">
                          <div className="font-semibold">{match.name}</div>
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            Email: {match.email || 'N/A'}
                          </div>
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            Closing: {match.closingDate}
                          </div>
                          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {match.daysUntil === 0 ? 'Closes TODAY' :
                             match.daysUntil === 1 ? 'Closes tomorrow' :
                             `Closes in ${match.daysUntil} days`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.notificationsSent === 0 && (
                  <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    No closings found within the next 15 days.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-900 dark:text-red-100">
                <span className="font-semibold">Error: </span>
                {result.error || 'Unknown error'}
              </div>
            )}
          </div>
        )}

        <div className="rounded-lg border border-zinc-200 bg-zinc-100 p-4 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <p className="font-semibold mb-2">Automated Schedule:</p>
          <p>This check runs automatically every day at 9:00 AM Central Time.</p>
        </div>
      </main>
    </div>
  );
}
