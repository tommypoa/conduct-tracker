/// NON-AUTH VERSION
import Tracker from "../components/Tracker";

export default function Home() {
  return <Tracker />;
}

/// AUTH VERSION

// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "../lib/supabaseClient";
// import Tracker from "../components/Tracker";

// export default function Home() {
//   const [session, setSession] = useState<any>(null);
//   const [email, setEmail] = useState("");
//   const [pw, setPw] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState<string | null>(null);

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data }) => {
//       setSession(data.session);
//       setLoading(false);
//     });

//     const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
//       setSession(newSession);
//     });

//     return () => sub.subscription.unsubscribe();
//   }, []);

//   const signIn = async () => {
//     setErr(null);
//     const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
//     if (error) setErr(error.message);
//   };

//   const signUp = async () => {
//     setErr(null);
//     const { error } = await supabase.auth.signUp({ email, password: pw });
//     if (error) setErr(error.message);
//     else setErr("Account created. If email confirmation is ON, check your inbox.");
//   };

//   const signOut = async () => {
//     await supabase.auth.signOut();
//   };

//   if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

//   if (!session) {
//     return (
//       <div style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
//         <h1 style={{ fontSize: 24, marginBottom: 12 }}>Alpha Conduct Tracker</h1>
//         <p style={{ marginBottom: 16, opacity: 0.8 }}>Sign in to access the shared board.</p>

//         <input
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           style={{ width: "100%", padding: 12, marginBottom: 12 }}
//         />
//         <input
//           placeholder="Password"
//           type="password"
//           value={pw}
//           onChange={(e) => setPw(e.target.value)}
//           style={{ width: "100%", padding: 12, marginBottom: 12 }}
//         />

//         <div style={{ display: "flex", gap: 12 }}>
//           <button onClick={signIn} style={{ padding: 12, flex: 1 }}>Sign In</button>
//           <button onClick={signUp} style={{ padding: 12, flex: 1 }}>Sign Up</button>
//         </div>

//         {err && <div style={{ marginTop: 12, color: "#c0392b" }}>{err}</div>}
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div style={{ display: "flex", justifyContent: "flex-end", padding: 12 }}>
//         <button onClick={signOut} style={{ padding: 10 }}>Sign Out</button>
//       </div>
//       <Tracker />
//     </div>
//   );
// }