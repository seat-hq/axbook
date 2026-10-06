"use client";

import { useEffect, useState } from "react";
import { links } from "@/lib/links";
import "./landing.css";

function UtcClock() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      setT(`${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <div className="clock">{t}</div>;
}

function CopyLink() {
  const [label, setLabel] = useState("Copy link");
  return (
    <button
      type="button"
      className="btn pri"
      style={{ height: 36 }}
      onClick={async () => {
        const url = "https://gomofamily.life/@altstein";
        try {
          await navigator.clipboard.writeText(url);
        } catch {}
        setLabel("Copied");
        setTimeout(() => setLabel("Copy link"), 1400);
      }}
    >
      {label}
    </button>
  );
}

const product = links.product.href ?? "/docs";

export function Landing() {
  return (
    <div className="gomo-site">

  <div className="hud">
    <header className="topbar">
      <div className="brand">
        <div>
          <div className="kicker"><span className="live">LIVE FEED</span> five desks · autonomy 88.8%</div>
          <a href="/" style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px'}}>
            <img src="/landing/gomo-logo.svg" alt=""/>
            <div>
              <h1>GOMO <span>//</span> SOCIAL TRADING TERMINAL</h1>
              <div className="sub">trade with people worth following · solana</div>
            </div>
          </a>
        </div>
      </div>
      <nav className="nav" aria-label="Primary">
        <a className="hot" href={product}>Trade</a>
        <a href={product}>Tokens</a>
        <a href={product}>Chill</a>
        <a href={product}>Launch</a>
        <a href={product}>Payouts</a>
        <a href={product}>Stats</a>
      </nav>
      <div className="stats">
        <div className="item"><div className="lbl">Mcap</div><div className="val">$671.9K</div></div>
        <div className="item"><div className="lbl">Vol</div><div className="val">$1.33M</div></div>
        <div className="item"><div className="lbl">Holders</div><div className="val">1,448</div></div>
        <div className="item"><div className="lbl">Liq</div><div className="val">$39.9K</div></div>
        <div>
          <UtcClock />
          <small><span className="live-pill"><i></i>LIVE</span> UTC</small>
        </div>
      </div>
    </header>

    <section className="row-top">
      <div className="panel">
        <div className="panel-h">
          <span className="badge red">Live feed</span>
          <span className="title">Gomo · 8 traders</span>
          <span className="meta">people · ideas · markets · trading</span>
        </div>
        <div className="feed-hero">
          <div>
            <div className="big">+$8,844</div>
            <div className="big-sub">PnL on $GOMO · EZ Money · return +907.5%</div>
          </div>
          <img src="/landing/avatars/ezmoney.jpg" alt="EZ Money" width="52" height="52" style={{width: '52px', height: '52px', borderRadius: '50%', boxShadow: '0 0 0 2px #050914,0 0 16px #4d9fff'}}/>
        </div>
        <svg className="spark" viewBox="0 0 280 42" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ff4d6d" stopOpacity="0.55"/>
              <stop offset="1" stopColor="#ff4d6d" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M0 30 L20 28 L40 29 L60 26 L80 27 L100 24 L120 25 L140 18 L160 14 L180 10 L200 8 L220 11 L240 9 L260 6 L280 4 L280 42 L0 42 Z" fill="url(#sg)"/>
          <path d="M0 30 L20 28 L40 29 L60 26 L80 27 L100 24 L120 25 L140 18 L160 14 L180 10 L200 8 L220 11 L240 9 L260 6 L280 4" fill="none" stroke="#ff4d6d" strokeWidth="1.6"/>
        </svg>
        <div className="kpi-row">
          <div className="kpi"><div className="n">1,448</div><div className="l">Holders 24h</div></div>
          <div className="kpi ok"><div className="n">+1,654%</div><div className="l">$GOMO return</div></div>
          <div className="kpi ok"><div className="n">88.8%</div><div className="l">Routines ok</div></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-h">
          <span className="title">Agent log</span>
          <span className="meta">18:01:04</span>
        </div>
        <table className="log">
          <thead><tr><th>Time</th><th>Who</th><th>What happened</th><th></th></tr></thead>
          <tbody>
            <tr><td className="time">09:01:04</td><td className="who paid">EZ$</td><td>followed you on the index</td><td className="tag faction">Faction</td></tr>
            <tr><td className="time">09:01:02</td><td className="who acct">ERIK</td><td>thesis posted on $GOMO</td><td className="tag caution">Caution</td></tr>
            <tr><td className="time">09:01:01</td><td className="who outbd">MM</td><td>quality mark: 1 times in 11 min</td><td className="tag caution">Caution</td></tr>
            <tr><td className="time">09:01:00</td><td className="who paid">LADY</td><td>site teardown result passed on</td><td className="tag faction">Faction</td></tr>
            <tr><td className="time">09:01:00</td><td className="who anlst">ANLST</td><td>reply triage came on the index</td><td className="tag caution">Caution</td></tr>
            <tr><td className="time">09:01:00</td><td className="who strat">STRAT</td><td>speed vs leads pulled for 3 campaigns</td><td className="tag approved">Approved</td></tr>
            <tr><td className="time">09:01:00</td><td className="who paid">PAID</td><td>inbound mail: Me re an answer</td><td className="tag approved">Approved</td></tr>
            <tr><td className="time">09:01:00</td><td className="who strat">STRAT</td><td>personalised drafts prepared</td><td className="tag faction">Client 2</td></tr>
          </tbody>
        </table>
        <div className="log-foot">368 tasks · 50 handoffs · 20 built for WD · no human in the field</div>
      </div>

      <div className="panel">
        <div className="panel-h">
          <span className="title">Skill forge</span>
          <span className="meta">run 0 of 6</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px'}}>
          <div>
            <div className="kicker" style={{marginBottom: '8px'}}><span className="dot"></span> Manual runs with the bot</div>
            <div style={{fontSize: '13px', fontWeight: '800', letterSpacing: '0.14em', textTransform: 'uppercase'}}>$GOMO teardown</div>
          </div>
          <div>
            <div className="kicker" style={{justifyContent: 'flex-end', marginBottom: '4px'}}>saved skills 17</div>
            <div className="saved">
              <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
              <i></i><i></i><i></i><i></i><i></i><i className="off"></i><i className="off"></i><i className="off"></i>
            </div>
          </div>
        </div>
        <div className="forge-top" style={{marginTop: '10px'}}>
          <div className="step on">1</div><div className="step on">2</div><div className="step on">3</div>
          <div className="step on">4</div><div className="step">5</div><div className="step">6</div>
        </div>
        <div className="chips">
          <span className="chip">1 Discover</span>
          <span className="chip">2 Thesis</span>
          <span className="chip">3 Market</span>
          <span className="chip">4 Trade</span>
          <span className="chip">Menu review</span>
        </div>
        <div className="gantt">
          <div className="lab">The schedule <span>— the day is a loop</span> <span style={{float: 'right', color: 'var(--green)'}}>5 running</span></div>
          <div className="bars">
            <div className="bar"><b style={{left: '4%', width: '28%', background: '#4d9fff'}}></b><b style={{left: '40%', width: '18%', background: '#3ee8d0'}}></b><b style={{left: '72%', width: '16%', background: '#9b8cff'}}></b></div>
            <div className="bar"><b style={{left: '8%', width: '22%', background: '#3ee07a'}}></b><b style={{left: '38%', width: '30%', background: '#e8c44a'}}></b><b style={{left: '78%', width: '14%', background: '#e060a0'}}></b></div>
            <div className="bar"><b style={{left: '2%', width: '16%', background: '#9b8cff'}}></b><b style={{left: '28%', width: '24%', background: '#4d9fff'}}></b><b style={{left: '60%', width: '22%', background: '#3ee8d0'}}></b></div>
            <div className="bar"><b style={{left: '12%', width: '20%', background: '#e8a04a'}}></b><b style={{left: '44%', width: '18%', background: '#3ee07a'}}></b><b style={{left: '70%', width: '20%', background: '#4d9fff'}}></b></div>
            <div className="bar"><b style={{left: '6%', width: '34%', background: '#3ee8d0'}}></b><b style={{left: '52%', width: '14%', background: '#e060a0'}}></b><b style={{left: '80%', width: '12%', background: '#e8c44a'}}></b></div>
          </div>
          <div className="log-foot" style={{marginTop: '8px'}}>08:28 &nbsp;·&nbsp; AI · day · 1 loop &nbsp;·&nbsp; signals 2204 · handoffs 38</div>
        </div>
      </div>
    </section>

    <section className="workspace">
      <div className="side">
        <article className="desk blue">
          <img className="av" src="/landing/avatars/ezmoney.jpg" alt="EZ Money"/>
          <div className="code" style={{color: 'var(--blue)'}}>ACCT</div>
          <div className="role">EZ Money · holding $GOMO</div>
          <div className="num">1</div>
          <div className="pct">1.4%</div>
          <div className="mini">1 clients · 27 tasks · 3 skills · 3 routines<br/>signals this session 328</div>
        </article>
        <article className="desk purple">
          <img className="av" src="/landing/avatars/erik.jpg" alt="Erik Stevens"/>
          <div className="code" style={{color: 'var(--purple)'}}>ANLST</div>
          <div className="role">Erik Stevens · sales analyst</div>
          <div className="num">5</div>
          <div className="pct">6.8%</div>
          <div className="mini">1 clients · 22 tasks · 2 skills · 3 routines<br/>signals this session 323</div>
        </article>
        <article className="desk yellow">
          <img className="av" src="/landing/avatars/moneyman.jpg" alt="Moneyman"/>
          <div className="code" style={{color: 'var(--yellow)'}}>PAID</div>
          <div className="role">Moneyman · paid media · +$2,598</div>
          <div className="num">6</div>
          <div className="pct">8.1%</div>
          <div className="mini">1 clients · 17 tasks · 4 skills · 4 routines<br/>signals this session 314</div>
        </article>
      </div>

      <div className="graph">
        <div className="ws-head">The workspace <span>gomo agents · the whole desk as one graph · 210 nodes</span></div>
        <svg viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="disk" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4d9fff" stopOpacity="0.16"/>
              <stop offset="70%" stopColor="#4d9fff" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="400" cy="210" r="188" fill="url(#disk)"/>
          <circle cx="400" cy="210" r="168" fill="none" stroke="rgba(77,159,255,0.18)" strokeWidth="1"/>
          <circle cx="400" cy="210" r="118" fill="none" stroke="rgba(77,159,255,0.12)" strokeWidth="1"/>
          <g stroke="rgba(120,180,220,0.22)" strokeWidth="0.8" fill="none">
            <line x1="400" y1="210" x2="220" y2="70"/>
            <line x1="400" y1="210" x2="140" y2="160"/>
            <line x1="400" y1="210" x2="160" y2="300"/>
            <line x1="400" y1="210" x2="280" y2="380"/>
            <line x1="400" y1="210" x2="520" y2="380"/>
            <line x1="400" y1="210" x2="660" y2="300"/>
            <line x1="400" y1="210" x2="680" y2="150"/>
            <line x1="400" y1="210" x2="560" y2="60"/>
            <line x1="400" y1="210" x2="310" y2="90"/>
            <line x1="400" y1="210" x2="490" y2="90"/>
            <line x1="400" y1="210" x2="240" y2="230"/>
            <line x1="400" y1="210" x2="580" y2="240"/>
          </g>
          <g className="a-flow" stroke="#4d9fff" strokeWidth="1.4" strokeDasharray="2 16" fill="none" strokeLinecap="round">
            <path d="M400 210 L220 70"/>
            <path d="M400 210 L660 300"/>
            <path d="M400 210 L160 300"/>
            <path d="M400 210 L560 60"/>
          </g>
          <g>
            <circle cx="220" cy="70" r="4" fill="#4d9fff"/><circle cx="140" cy="160" r="3" fill="#3ee8d0"/>
            <circle cx="160" cy="300" r="5" fill="#9b8cff"/><circle cx="280" cy="380" r="3" fill="#e8c44a"/>
            <circle cx="520" cy="380" r="4" fill="#3ee07a"/><circle cx="660" cy="300" r="5" fill="#e8a04a"/>
            <circle cx="680" cy="150" r="3" fill="#e060a0"/><circle cx="560" cy="60" r="4" fill="#4d9fff"/>
            <circle cx="310" cy="90" r="3" fill="#3ee8d0"/><circle cx="490" cy="90" r="3" fill="#9b8cff"/>
            <circle cx="240" cy="230" r="2.5" fill="#3ee07a"/><circle cx="580" cy="240" r="2.5" fill="#e8c44a"/>
            <circle cx="200" cy="210" r="2" fill="#4d9fff"/><circle cx="620" cy="190" r="2" fill="#3ee8d0"/>
            <circle cx="350" cy="340" r="2" fill="#e060a0"/><circle cx="470" cy="330" r="2" fill="#4d9fff"/>
            <circle cx="300" cy="160" r="2" fill="#e8a04a"/><circle cx="520" cy="160" r="2" fill="#3ee07a"/>
            <circle cx="250" cy="120" r="1.6" fill="#4d9fff"/><circle cx="330" cy="50" r="1.5" fill="#3ee8d0"/>
            <circle cx="450" cy="48" r="1.4" fill="#9b8cff"/><circle cx="610" cy="90" r="1.6" fill="#e8c44a"/>
            <circle cx="720" cy="210" r="1.5" fill="#3ee07a"/><circle cx="700" cy="340" r="1.4" fill="#e060a0"/>
            <circle cx="430" cy="390" r="1.6" fill="#4d9fff"/><circle cx="180" cy="360" r="1.5" fill="#e8a04a"/>
            <circle cx="90" cy="240" r="1.4" fill="#3ee8d0"/><circle cx="120" cy="100" r="1.5" fill="#9b8cff"/>
            <circle cx="360" cy="120" r="1.3" fill="#3ee07a"/><circle cx="440" cy="140" r="1.3" fill="#4d9fff"/>
            <circle cx="340" cy="280" r="1.4" fill="#e8c44a"/><circle cx="470" cy="250" r="1.4" fill="#e060a0"/>
            <circle cx="390" cy="70" r="1.2" fill="#3ee8d0"/><circle cx="510" cy="300" r="1.3" fill="#4d9fff"/>
            <circle cx="270" cy="300" r="1.3" fill="#9b8cff"/><circle cx="600" cy="120" r="1.2" fill="#3ee07a"/>
            <circle cx="150" cy="250" r="1.2" fill="#4d9fff"/><circle cx="640" cy="260" r="1.3" fill="#e8a04a"/>
            <circle cx="380" cy="360" r="1.2" fill="#3ee8d0"/><circle cx="420" cy="100" r="1.2" fill="#e060a0"/>
          </g>
        </svg>
        <div className="node lg" style={{left: '28%', top: '18%', color: '#4d9fff'}}><img src="/landing/avatars/ezmoney.jpg" alt="EZ Money"/></div>
        <div className="node" style={{left: '18%', top: '42%', color: '#3ee8d0'}}><img src="/landing/avatars/moneyman.jpg" alt="Moneyman"/></div>
        <div className="node" style={{left: '22%', top: '72%', color: '#9b8cff'}}><img src="/landing/avatars/ladyt.jpg" alt="LADY T"/></div>
        <div className="node lg" style={{left: '72%', top: '22%', color: '#4d9fff'}}><img src="/landing/avatars/erik.jpg" alt="Erik Stevens"/></div>
        <div className="node" style={{left: '80%', top: '58%', color: '#e8a04a'}}><img src="/landing/avatars/francis.jpg" alt="@frances_bentleyx"/></div>
        <div className="node" style={{left: '68%', top: '82%', color: '#3ee07a'}}><img src="/landing/avatars/omz.jpg" alt="@Omz19"/></div>
        <div className="node" style={{left: '38%', top: '84%', color: '#e8c44a'}}><img src="/landing/avatars/monkey.jpg" alt="@LaCryptoMonkey"/></div>
        <div className="node" style={{left: '86%', top: '36%', color: '#e060a0'}}><img src="/landing/avatars/altstein.jpg" alt="Altstein"/></div>
        <div className="hub">
          <img src="/landing/gomo-logo.svg" alt="Gomo"/>
          <div className="pause" aria-label="pause"><i></i><i></i></div>
        </div>
        <div className="ws-note">09:44 handoff · strat → acct → into workspace · no human in the middle</div>
      </div>

      <div className="side">
        <article className="desk cyan">
          <img className="av" src="/landing/gomo-logo.svg" alt="$GOMO"/>
          <div className="code" style={{color: 'var(--cyan)'}}>STRAT</div>
          <div className="role">Growth strategy · $GOMO</div>
          <div className="num">27</div>
          <div className="pct">36.5%</div>
          <div className="mini">2 clients · 7 tasks · 2 skills · 2 routines<br/>signals this session 309</div>
        </article>
        <article className="desk green">
          <img className="av" src="/landing/avatars/ladyt.jpg" alt="LADY T"/>
          <div className="code" style={{color: 'var(--green)'}}>OUTBD</div>
          <div className="role">LADY T ⁶⁹⁰⁰ · sales outbound</div>
          <div className="num">35</div>
          <div className="pct">47.3%</div>
          <div className="mini">2 clients · 12 tasks · 4 skills · 3 routines<br/>signals this session 307</div>
        </article>
        <article className="desk blue">
          <div className="code" style={{color: 'var(--blue)'}}>TRADE</div>
          <div className="role">Buy $GOMO · 0% gomo fee</div>
          <div className="num" style={{fontSize: '22px'}}>$100</div>
          <div className="mini">≈ 125.8K $GOMO · Solana network fee only</div>
          <a className="btn pri" href={product} style={{marginTop: '8px', height: '28px', fontSize: '11px'}}>Buy $GOMO</a>
        </article>
      </div>
    </section>

    <section className="bottom">
      <div>
        <div className="panel-h" style={{padding: '0 2px 6px'}}>
          <span className="title" style={{color: 'var(--cyan)'}}>The five desks</span>
          <span className="meta">one function, one owner · strat active</span>
        </div>
        <div className="desks5">
          <div className="sparkcard">
            <div className="nm" style={{color: 'var(--blue)'}}>STRAT</div>
            <div className="rl">Growth strategy</div>
            <svg viewBox="0 0 120 36" width="100%" height="36" aria-hidden="true"><path d="M0 28 L12 24 L24 26 L36 18 L48 20 L60 12 L72 14 L84 8 L96 10 L108 6 L120 8" fill="none" stroke="#4d9fff" strokeWidth="1.6"/></svg>
            <div className="v" style={{color: 'var(--blue)'}}>2.7 <small>/h</small></div>
            <div className="rl">Tasks 24h · 72 ago</div>
          </div>
          <div className="sparkcard">
            <div className="nm" style={{color: 'var(--green)'}}>OUTBD</div>
            <div className="rl">Sales outbound</div>
            <svg viewBox="0 0 120 36" width="100%" height="36" aria-hidden="true"><path d="M0 22 L12 18 L24 20 L36 10 L48 16 L60 8 L72 14 L84 6 L96 12 L108 4 L120 8" fill="none" stroke="#3ee07a" strokeWidth="1.6"/></svg>
            <div className="v" style={{color: 'var(--green)'}}>3.5 <small>/h</small></div>
            <div className="rl">Tasks 24h · 72 ago</div>
          </div>
          <div className="sparkcard">
            <div className="nm" style={{color: 'var(--yellow)'}}>PAID</div>
            <div className="rl">Paid media</div>
            <svg viewBox="0 0 120 36" width="100%" height="36" aria-hidden="true"><path d="M0 24 L12 20 L24 22 L36 16 L48 18 L60 12 L72 14 L84 10 L96 12 L108 8 L120 11" fill="none" stroke="#e8c44a" strokeWidth="1.6"/></svg>
            <div className="v" style={{color: 'var(--yellow)'}}>0.6 <small>/h</small></div>
            <div className="rl">Tasks 24h · 3.2</div>
          </div>
          <div className="sparkcard">
            <div className="nm" style={{color: 'var(--purple)'}}>ANLST</div>
            <div className="rl">Sales analyst</div>
            <svg viewBox="0 0 120 36" width="100%" height="36" aria-hidden="true"><path d="M0 26 L12 22 L24 24 L36 18 L48 20 L60 16 L72 14 L84 12 L96 13 L108 10 L120 12" fill="none" stroke="#9b8cff" strokeWidth="1.6"/></svg>
            <div className="v" style={{color: 'var(--purple)'}}>0.5 <small>/h</small></div>
            <div className="rl">Tasks 24h · 17</div>
          </div>
          <div className="sparkcard">
            <div className="nm" style={{color: 'var(--blue)'}}>ACCT</div>
            <div className="rl">Account manager</div>
            <svg viewBox="0 0 120 36" width="100%" height="36" aria-hidden="true"><path d="M0 20 L12 22 L24 18 L36 16 L48 18 L60 12 L72 14 L84 10 L96 11 L108 8 L120 9" fill="none" stroke="#4d9fff" strokeWidth="1.6"/></svg>
            <div className="v" style={{color: 'var(--blue)'}}>0.1 <small>/h</small></div>
            <div className="rl">Tasks 24h · 27</div>
          </div>
        </div>
      </div>
      <div className="method">
        <div className="method-h">
          The method <span>eight gates every task goes through</span>
          <span className="right">Gate 7 · 4 waiting</span>
        </div>
        <svg viewBox="0 0 640 110" preserveAspectRatio="none" aria-label="$GOMO 15 minute chart">
          <defs>
            <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e8c44a" stopOpacity="0.55"/><stop offset="1" stopColor="#e8c44a" stopOpacity="0.05"/></linearGradient>
            <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9b8cff" stopOpacity="0.5"/><stop offset="1" stopColor="#9b8cff" stopOpacity="0.05"/></linearGradient>
            <linearGradient id="a3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3ee07a" stopOpacity="0.45"/><stop offset="1" stopColor="#3ee07a" stopOpacity="0.04"/></linearGradient>
          </defs>
          <path d="M0 88 L80 86 L160 80 L240 70 L320 52 L400 40 L480 28 L560 22 L640 18 L640 110 L0 110 Z" fill="url(#a1)"/>
          <path d="M0 96 L80 94 L160 90 L240 84 L320 72 L400 64 L480 58 L560 54 L640 50 L640 110 L0 110 Z" fill="url(#a2)"/>
          <path d="M0 102 L80 100 L160 98 L240 94 L320 88 L400 84 L480 80 L560 78 L640 76 L640 110 L0 110 Z" fill="url(#a3)"/>
          <line x1="520" y1="0" x2="520" y2="110" stroke="#e8c44a" strokeWidth="1.2"/>
          <g fill="#3ee07a">
            <circle cx="40" cy="92" r="1.4"/><circle cx="90" cy="70" r="1.2"/><circle cx="140" cy="84" r="1.3"/>
            <circle cx="200" cy="60" r="1.5"/><circle cx="260" cy="48" r="1.2"/><circle cx="310" cy="66" r="1.4"/>
            <circle cx="370" cy="38" r="1.3"/><circle cx="430" cy="52" r="1.2"/><circle cx="480" cy="30" r="1.5"/>
            <circle cx="540" cy="44" r="1.3"/><circle cx="590" cy="22" r="1.4"/><circle cx="620" cy="36" r="1.2"/>
          </g>
        </svg>
        <div className="method-leg">
          <span>Simple</span>
          <span><b>10 clients in parallel</b></span>
          <span><b>5 AI employees</b></span>
          <span>Parallel client capacity <b>+50%</b></span>
          <span><b>10 clients this</b></span>
        </div>
      </div>
    </section>
  </div>

  <section className="page" id="gl-top">
    <div className="split">
      <h2>Trade with people worth following.</h2>
      <div>
        <p className="lead">Discover traders, follow their ideas, see what they are watching and trade directly from the same platform.</p>
        <div className="cta-bar">
          <a className="btn pri" href={product}>Launch Gomo</a>
          <a className="btn sec" href={product}>Explore traders</a>
        </div>
        <div className="cta-bar" style={{marginTop: '16px', color: 'var(--muted)', fontSize: '13px'}}>
          <img src="/landing/avatars/moneyman.jpg" alt="" width="26" height="26" style={{width: '26px', height: '26px', borderRadius: '50%'}}/>
          <img src="/landing/avatars/ladyt.jpg" alt="" width="26" height="26" style={{width: '26px', height: '26px', borderRadius: '50%', marginLeft: '-8px'}}/>
          <img src="/landing/avatars/francis.jpg" alt="" width="26" height="26" style={{width: '26px', height: '26px', borderRadius: '50%', marginLeft: '-8px'}}/>
          <img src="/landing/avatars/omz.jpg" alt="" width="26" height="26" style={{width: '26px', height: '26px', borderRadius: '50%', marginLeft: '-8px'}}/>
          <span><b style={{color: 'var(--text)'}}>…</b> traders online now</span>
        </div>
      </div>
    </div>
  </section>

  <section className="page" id="gl-social" style={{paddingTop: '8px'}}>
    <div className="split">
      <h2>Trading starts with people.</h2>
      <p className="lead">Markets move because people discover ideas, share conviction and act. Gomo brings that entire flow into one place.</p>
    </div>
    <div className="flow">
      <article className="card">
        <div className="stepn"><i>1</i> Discover a trader</div>
        <div className="who-row">
          <img src="/landing/avatars/erik.jpg" alt="Erik Stevens"/>
          <div><div className="nm">Erik Stevens</div><div className="sub">Top trader in $GOMO</div></div>
        </div>
        <div className="metrics">
          <div><div className="l">PnL</div><div className="n">+$8,844</div></div>
          <div><div className="l">Return</div><div className="n">+907.5%</div></div>
        </div>
        <div className="l" style={{marginTop: '12px', fontSize: '10px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: '700'}}>Watching</div>
        <div className="tags"><span>$GOMO</span><span>$GMAX</span><span>$GOMOCHAN</span></div>
      </article>
      <article className="card">
        <div className="stepn"><i>2</i> Read the thesis</div>
        <div className="who-row">
          <img src="/landing/avatars/erik.jpg" alt="Erik Stevens" style={{width: '32px', height: '32px'}}/>
          <div><div className="nm" style={{fontSize: '14px'}}>Erik Stevens</div><div className="sub">in $GOMO · 14m</div></div>
        </div>
        <p className="thesis">Thesis: social launches win when trading and talking happen in one place. Every gomo coin pairs a chart with its community, so conviction is visible, not hidden in group chats.</p>
        <div className="tokenrow">
          <img src="/landing/gomo-logo.svg" alt=""/>
          <div><div style={{fontWeight: '800', fontSize: '13px'}}>$GOMO</div><div style={{fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)'}}>$0.000795</div></div>
        </div>
        <div style={{display: 'flex', gap: '16px', marginTop: '12px', color: 'var(--muted)', fontSize: '12px', fontWeight: '600'}}>
          <span>Reply</span><span>Like</span><span style={{marginLeft: 'auto'}}>44 views</span>
        </div>
      </article>
      <article className="card">
        <div className="stepn"><i>3</i> See the market</div>
        <div className="who-row">
          <img src="/landing/gomo-logo.svg" alt="" style={{width: '30px', height: '30px'}}/>
          <div style={{flex: '1'}}><div className="nm">$GOMO</div><div className="sub">Market cap</div></div>
          <div style={{fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)'}}>5m <b style={{color: 'var(--text)'}}>15m</b> 1h</div>
        </div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px'}}>
          <span style={{fontFamily: 'var(--mono)', fontSize: '24px', fontWeight: '600'}}>$671.9K</span>
          <span style={{fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--green)'}}>+1,654.69%</span>
        </div>
        <svg viewBox="0 0 260 70" style={{width: '100%', height: '70px', marginTop: '8px'}} aria-hidden="true">
          <path d="M0 58 L20 56 L40 57 L60 54 L80 52 L100 48 L120 40 L140 32 L160 24 L180 18 L200 16 L220 20 L240 22 L260 26" fill="none" stroke="#3ee07a" strokeWidth="2"/>
        </svg>
        <div className="sub" style={{marginTop: '6px'}}>Faces on the chart show who traded, and when</div>
      </article>
      <article className="card">
        <div className="stepn"><i>4</i> Trade</div>
        <div className="buytab"><span className="on">Buy</span><span>Sell</span></div>
        <div className="amt">
          <div className="l">Amount</div>
          <div className="n">$100 <small style={{fontSize: '12px', color: 'var(--muted)'}}>USD</small></div>
          <div className="x">≈ 125.8K $GOMO</div>
        </div>
        <a className="btn pri" href={product} style={{width: '100%', marginTop: '12px'}}>Buy $GOMO</a>
        <div className="fee">0% gomo fee · only Solana network fee</div>
      </article>
    </div>
    <div className="cta-bar" style={{justifyContent: 'center', marginTop: '28px'}}>
      <span className="chip" style={{borderColor: 'var(--cyan)', color: 'var(--cyan)'}}>Following</span>
      <span style={{fontWeight: '700'}}>Follow the ones who get it right.</span>
      <span style={{color: 'var(--muted)'}}>Their next thesis lands in your feed.</span>
    </div>
  </section>

  <section className="page" id="gl-network">
    <div className="split" style={{alignItems: 'center'}}>
      <div>
        <h2>Bring your network with you.</h2>
        <p className="lead">Create your referral link, invite traders into Gomo and grow your network as the platform expands.</p>
        <div className="l" style={{marginTop: '28px', fontSize: '11px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: '700'}}>Your referral link</div>
        <div className="refbox">
          <code>gomofamily.life/@<span id="ref-handle">altstein</span></code>
          <CopyLink />
        </div>
        <div className="l" style={{marginTop: '22px', fontSize: '11px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: '700'}}>Joined through your link</div>
        <div className="joinlist">
          <div className="join"><img src="/landing/avatars/monkey.jpg" alt=""/><strong>@LaCryptoMonkey</strong><span className="t">joined and followed you</span><span className="ago">2m</span></div>
          <div className="join"><img src="/landing/avatars/francis.jpg" alt=""/><strong>@frances_bentleyx</strong><span className="t">invited 2 traders</span><span className="ago">18m</span></div>
          <div className="join"><img src="/landing/avatars/omz.jpg" alt=""/><strong>@Omz19</strong><span className="t">joined</span><span className="ago">1h</span></div>
        </div>
      </div>
      <div className="net">
        <svg viewBox="0 0 560 560" aria-hidden="true">
          <circle cx="280" cy="280" r="120" fill="none" stroke="rgba(77,159,255,0.22)"/>
          <circle cx="280" cy="280" r="200" fill="none" stroke="rgba(77,159,255,0.14)"/>
          <circle cx="280" cy="280" r="240" fill="none" stroke="rgba(62,232,208,0.12)" strokeDasharray="3 6"/>
          <g className="a-flow" stroke="#4d9fff" strokeWidth="1.6" strokeDasharray="2 18" fill="none">
            <path d="M280 280 L250 140"/>
            <path d="M280 280 L410 320"/>
            <path d="M280 280 L170 360"/>
            <path d="M280 280 L430 180"/>
          </g>
        </svg>
        <img src="/landing/gomo-logo.svg" alt="Gomo" className="av" style={{left: '50%', top: '50%', width: '88px', height: '88px', borderRadius: '0', boxShadow: 'none', filter: 'drop-shadow(0 0 20px rgba(77,159,255,.5))'}}/>
        <img src="/landing/avatars/monkey.jpg" alt="@LaCryptoMonkey" className="av" style={{left: '46%', top: '25%'}}/>
        <img src="/landing/avatars/francis.jpg" alt="@frances_bentleyx" className="av" style={{left: '73%', top: '58%'}}/>
        <img src="/landing/avatars/omz.jpg" alt="@Omz19" className="av" style={{left: '32%', top: '66%'}}/>
        <img src="/landing/avatars/ezmoney.jpg" alt="EZ Money" className="av" style={{left: '18%', top: '40%', width: '40px', height: '40px'}}/>
        <img src="/landing/avatars/erik.jpg" alt="Erik Stevens" className="av" style={{left: '82%', top: '32%', width: '40px', height: '40px'}}/>
        <img src="/landing/avatars/ladyt.jpg" alt="LADY T" className="av" style={{left: '78%', top: '78%', width: '36px', height: '36px'}}/>
        <img src="/landing/avatars/altstein.jpg" alt="Altstein" className="av" style={{left: '22%', top: '78%', width: '36px', height: '36px'}}/>
        <img src="/landing/avatars/moneyman.jpg" alt="Moneyman" className="av" style={{left: '58%', top: '12%', width: '36px', height: '36px'}}/>
      </div>
    </div>
  </section>

  <section className="page cta-block" id="gl-join">
    <h2>Find your next trade through people.</h2>
    <p>Discover traders, follow conviction and trade from one place.</p>
    <div className="cta-row">
      <a className="btn pri" href={product} style={{height: '48px', padding: '0 24px'}}>Launch Gomo</a>
      <a className="btn sec" href={product} style={{height: '48px', padding: '0 24px'}}>Join the network</a>
    </div>
  </section>

  <footer className="foot">
    <a href="/" style={{display: 'flex', alignItems: 'center', gap: '8px'}}><img src="/landing/gomo-logo.svg" alt=""/><strong>gomo</strong></a>
    <span>© 2026 gomo · Solana</span>
    <nav aria-label="Footer">
      <a href={product}>Launch</a>
      <a href={product}>Payouts</a>
      <a href={product}>Stats</a>
      <a href="/docs">Partners</a>
      <a href="/docs">Docs</a>
      <a href="https://x.com/gomo_family" target="_blank" rel="noopener noreferrer">X</a>
    </nav>
  </footer>

  

    </div>
  );
}
