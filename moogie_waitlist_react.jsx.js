import React, { useEffect, useState } from "react";

// Moogie Waitlist - Single-file React component
// Usage: drop this file into a React app (e.g. create-react-app / Vite + React)
// Requires Tailwind CSS available in the project for styling (classes used below).
// Optional: you can enable a real backend by implementing POST /api/waitlist which accepts { address }

export default function MoogieWaitlist() {
  const [address, setAddress] = useState("");
  const [shortAddress, setShortAddress] = useState("");
  const [connected, setConnected] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    // If user already connected previously, try to read the address
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts && accounts.length > 0) {
            handleNewAccount(accounts[0]);
          }
        })
        .catch(() => {});

      // listen for account / chain changes
      window.ethereum.on && window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          resetConnection();
        } else {
          handleNewAccount(accounts[0]);
        }
      });

      window.ethereum.on && window.ethereum.on("chainChanged", (c) => {
        setChainId(c);
      });
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function isValidEvmAddress(a) {
    return /^0x[a-fA-F0-9]{40}$/.test(a);
  }

  function shorten(address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function handleNewAccount(acc) {
    setAddress(acc);
    setShortAddress(shorten(acc));
    setConnected(true);
    setError("");
  }

  function resetConnection() {
    setAddress("");
    setShortAddress("");
    setConnected(false);
    setChainId(null);
    setJoined(false);
  }

  async function connectWallet() {
    setError("");
    if (!window.ethereum) {
      setError("No Ethereum provider detected. Install MetaMask or another wallet.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      handleNewAccount(accounts[0]);
      const c = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(c);
    } catch (err) {
      setError("Connection rejected or failed.");
      console.error(err);
    }
  }

  async function joinWaitlist() {
    setError("");
    if (!address || !isValidEvmAddress(address)) {
      setError("Please connect a valid EVM address first.");
      return;
    }

    setJoining(true);

    try {
      // Example: optimistic localStorage-based implementation so the component is usable
      // Replace this block with a fetch() POST to your backend (e.g. /api/waitlist) when ready.
      const existing = JSON.parse(localStorage.getItem("moogie_waitlist") || "[]");
      if (existing.includes(address.toLowerCase())) {
        setJoined(true);
        setJoining(false);
        return;
      }

      // Simulate a network call (you can replace with fetch)
      await new Promise((res) => setTimeout(res, 600));
      existing.push(address.toLowerCase());
      localStorage.setItem("moogie_waitlist", JSON.stringify(existing));

      // If you want a backend call instead, uncomment and adapt below:
      /*
      const resp = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      if (!resp.ok) throw new Error('Server rejected waitlist join');
      */

      setJoined(true);
    } catch (err) {
      console.error(err);
      setError("Failed to join waitlist. Try again.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Moogie Waitlist</h1>
            <p className="text-sm text-slate-300">Securely join the waitlist using your EVM address</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Network</div>
            <div className="text-sm text-white">{chainId ?? "—"}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/3 rounded-xl p-3 border border-white/5">
            <div className="text-xs text-slate-300">Connected wallet</div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="font-mono text-sm text-white">{shortAddress || "Not connected"}</div>
                <div className="text-xs text-slate-400 mt-1">{address || "Connect to see full address"}</div>
              </div>
              <div className="flex items-center gap-2">
                {!connected ? (
                  <button
                    onClick={connectWallet}
                    className="px-3 py-1 rounded-lg bg-emerald-500 text-black font-semibold text-sm hover:opacity-90"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <button
                    onClick={() => navigator.clipboard.writeText(address)}
                    className="px-3 py-1 rounded-lg border border-white/10 text-sm text-slate-200"
                    title="Copy address"
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/3 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Join Waitlist</h2>
                <p className="text-xs text-slate-300">We'll add your EVM address to the Moogie waitlist.</p>
              </div>
              <div>
                <button
                  disabled={!connected || joining || joined}
                  onClick={joinWaitlist}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    joined
                      ? "bg-slate-600 text-slate-300 cursor-default"
                      : "bg-indigo-500 text-white hover:brightness-105"
                  }`}
                >
                  {joining ? "Joining..." : joined ? "Joined" : "Join Waitlist"}
                </button>
              </div>
            </div>
            {error && <div className="mt-3 text-xs text-red-300">{error}</div>}
            {joined && <div className="mt-3 text-xs text-emerald-300">Thanks — your address is on the waitlist.</div>}
          </div>

          <div className="text-xs text-slate-400">
            Tip: this demo stores your participation locally. For production, implement a backend endpoint
            (e.g. <span className="font-mono">POST /api/waitlist</span>) that records addresses and protects against
            duplicate signups.
          </div>
        </div>

        <div className="mt-6 border-t border-white/5 pt-4 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <div>Moogie · v0.1</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // quick debug helper to show localStorage count
                  const existing = JSON.parse(localStorage.getItem("moogie_waitlist") || "[]");
                  alert(`Local waitlist count: ${existing.length}`);
                }}
                className="px-2 py-1 rounded-md border border-white/6 text-xs"
              >
                Debug
              </button>
              <button onClick={resetConnection} className="px-2 py-1 rounded-md border border-white/6 text-xs">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
