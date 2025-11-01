"""
MPF CoT (Multi-Agent Framework Chain-of-Thought) Reasoning Layer
3 independent agents + aggregation decision engine
"""

import asyncio
import numpy as np
import pandas as pd
import random
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class TechnicalAgent:
    """Analyzes technical indicators and generates BUY/SELL signal with reasoning"""

    name = "Technical Analysis Agent"

    def analyze(self, features_df: pd.DataFrame) -> dict:
        latest = features_df.iloc[-1]
        signals = []
        reasoning_steps = []

        # RSI Analysis
        rsi = latest.get('RSI', 50)
        if rsi < 30:
            signals.append(2)  # Strong buy
            reasoning_steps.append(f"RSI at {rsi:.1f} is deeply oversold (< 30) — historically a strong reversal signal.")
        elif rsi < 45:
            signals.append(1)
            reasoning_steps.append(f"RSI at {rsi:.1f} is approaching oversold territory — mild bullish bias.")
        elif rsi > 70:
            signals.append(-2)
            reasoning_steps.append(f"RSI at {rsi:.1f} is overbought (> 70) — potential distribution phase, bearish.")
        elif rsi > 55:
            signals.append(-1)
            reasoning_steps.append(f"RSI at {rsi:.1f} is elevated — caution, momentum may be fading.")
        else:
            signals.append(0)
            reasoning_steps.append(f"RSI at {rsi:.1f} is neutral — no directional bias from momentum oscillator.")

        # MACD Analysis
        macd = latest.get('MACD', 0)
        macd_signal = latest.get('MACD_Signal', 0)
        macd_hist = latest.get('MACD_Hist', 0)
        if macd > macd_signal and macd_hist > 0:
            signals.append(2)
            reasoning_steps.append(f"MACD ({macd:.4f}) > Signal ({macd_signal:.4f}) with positive histogram — bullish crossover confirmed.")
        elif macd > macd_signal:
            signals.append(1)
            reasoning_steps.append(f"MACD above signal line but histogram narrowing — weakening upside momentum.")
        elif macd < macd_signal and macd_hist < 0:
            signals.append(-2)
            reasoning_steps.append(f"MACD ({macd:.4f}) < Signal ({macd_signal:.4f}) — bearish crossover. Sell pressure dominant.")
        else:
            signals.append(-1)
            reasoning_steps.append(f"MACD below signal — mild bearish divergence forming.")

        # EMA Cross
        ema_cross = latest.get('EMA_Cross', 0)
        if ema_cross > 0.01:
            signals.append(1)
            reasoning_steps.append(f"Short EMA above Long EMA by {ema_cross*100:.2f}% — trend is bullish, price above key moving average.")
        elif ema_cross < -0.01:
            signals.append(-1)
            reasoning_steps.append(f"Short EMA below Long EMA — downtrend structure intact, bearish alignment.")
        else:
            signals.append(0)
            reasoning_steps.append("EMA crossover is flat — market consolidating, no clear trend direction.")

        # Bollinger Band position
        bb_pct = latest.get('BB_Pct', 0.5)
        if bb_pct < 0.15:
            signals.append(2)
            reasoning_steps.append(f"Price at {bb_pct*100:.1f}% of Bollinger Band range — near lower band, mean reversion opportunity.")
        elif bb_pct > 0.85:
            signals.append(-2)
            reasoning_steps.append(f"Price at {bb_pct*100:.1f}% of Bollinger Band — near upper band, overextended, risk of pullback.")
        else:
            signals.append(0)
            reasoning_steps.append(f"Price at {bb_pct*100:.1f}% within Bollinger Bands — neutral positioning.")

        # Compute final signal
        avg_signal = np.mean(signals)
        if avg_signal >= 1.2:
            decision = "BUY"
            strength = "Strong"
        elif avg_signal >= 0.3:
            decision = "BUY"
            strength = "Moderate"
        elif avg_signal <= -1.2:
            decision = "SELL"
            strength = "Strong"
        elif avg_signal <= -0.3:
            decision = "SELL"
            strength = "Moderate"
        else:
            decision = "HOLD"
            strength = "Neutral"

        confidence = min(95, max(30, abs(avg_signal) * 30 + 40))

        return {
            "agent": "Technical",
            "decision": decision,
            "strength": strength,
            "confidence": round(confidence, 1),
            "signal_score": round(avg_signal, 3),
            "reasoning": reasoning_steps,
            "summary": f"Technical indicators show a {strength.lower()} {decision} signal (score: {avg_signal:.2f}) based on RSI, MACD, EMA crossover, and Bollinger Bands analysis.",
            "indicators": {
                "RSI": round(rsi, 2),
                "MACD": round(macd, 4),
                "MACD_Signal": round(macd_signal, 4),
                "BB_Pct": round(bb_pct, 3),
                "EMA_Cross": round(ema_cross, 4)
            }
        }


class SentimentAgent:
    """Analyzes market sentiment using volume, momentum, and simulated news"""

    name = "Market Sentiment Agent"

    SENTIMENT_TEMPLATES = {
        "bullish": [
            "Institutional accumulation detected — large block trades on upticks suggest smart money positioning.",
            "Sector rotation into growth assets accelerating. Risk-on sentiment driving flows.",
            "Analyst consensus upgrades exceeding downgrades 3:1 ratio this week.",
            "Options market showing increased call activity — bulls paying premium for upside exposure.",
        ],
        "bearish": [
            "Unusual put/call ratio spike indicating hedging activity — institutional caution elevated.",
            "Macro headwinds persist: yields rising, dollar strengthening — risk-off rotation underway.",
            "Short interest increasing. Short sellers building positions at current price levels.",
            "Earnings revisions turning negative. Forward guidance disappointing analyst estimates.",
        ],
        "neutral": [
            "Mixed signals from options flow — market awaiting macro catalyst before directional commitment.",
            "News flow balanced. No material positive or negative catalysts identified in current window.",
            "Volume patterns inconclusive. Neither conviction buying nor distribution detected.",
        ]
    }

    def analyze(self, features_df: pd.DataFrame) -> dict:
        latest = features_df.iloc[-1]

        # Volume-based sentiment
        vol_ratio = latest.get('Volume_Ratio', 1.0)
        momentum = latest.get('Momentum_10', 0)
        roc = latest.get('ROC', 0)

        vol_sentiment = 0
        reasoning = []

        if vol_ratio > 1.5 and momentum > 0:
            vol_sentiment = 2
            reasoning.append(f"Volume {vol_ratio:.1f}x above average on positive price action — institutional accumulation signal.")
        elif vol_ratio > 1.5 and momentum < 0:
            vol_sentiment = -2
            reasoning.append(f"High volume ({vol_ratio:.1f}x avg) on declining price — distribution phase detected, bearish.")
        elif vol_ratio < 0.7:
            vol_sentiment = -0.5
            reasoning.append(f"Below-average volume ({vol_ratio:.2f}x) — low conviction in current move, skeptical of trend.")
        else:
            reasoning.append(f"Volume ratio {vol_ratio:.2f}x — normal activity, no unusual institutional behavior detected.")

        # Momentum sentiment
        mom_sentiment = 0
        if momentum > 0.05:
            mom_sentiment = 1.5
            reasoning.append(f"10-day momentum at +{momentum*100:.1f}% — positive price trajectory, sentiment improving.")
        elif momentum < -0.05:
            mom_sentiment = -1.5
            reasoning.append(f"10-day momentum at {momentum*100:.1f}% — negative drift, market sentiment deteriorating.")
        else:
            reasoning.append(f"10-day momentum flat at {momentum*100:.2f}% — no directional conviction from participants.")

        # Simulated news sentiment score
        news_score = np.random.normal(0.1 + momentum * 2, 0.3)
        news_score = np.clip(news_score, -1, 1)
        sentiment_direction = "bullish" if news_score > 0.1 else ("bearish" if news_score < -0.1 else "neutral")
        news_snippet = random.choice(self.SENTIMENT_TEMPLATES[sentiment_direction])
        reasoning.append(f"[News Sentiment] {news_snippet}")

        avg_sentiment = np.mean([vol_sentiment, mom_sentiment, news_score * 2])

        if avg_sentiment >= 1.0:
            decision = "BUY"
        elif avg_sentiment <= -1.0:
            decision = "SELL"
        else:
            decision = "HOLD"

        sentiment_score = round(np.clip((avg_sentiment + 2) / 4 * 100, 5, 95), 1)
        confidence = round(min(90, abs(avg_sentiment) * 25 + 45), 1)

        return {
            "agent": "Sentiment",
            "decision": decision,
            "confidence": confidence,
            "sentiment_score": sentiment_score,
            "volume_ratio": round(vol_ratio, 3),
            "momentum_10d": round(momentum * 100, 2),
            "news_sentiment": round(news_score, 3),
            "reasoning": reasoning,
            "summary": f"Market sentiment analysis returns a score of {sentiment_score}/100 ({sentiment_direction}). Volume patterns and momentum suggest {decision} conditions."
        }


class VolatilityAgent:
    """Analyzes market regime and volatility conditions"""

    name = "Volatility & Regime Agent"

    def analyze(self, features_df: pd.DataFrame) -> dict:
        latest = features_df.iloc[-1]
        reasoning = []

        vol_10 = latest.get('Volatility_10', 0.2)
        vol_30 = latest.get('Volatility_30', 0.2)
        bb_width = latest.get('BB_Width', 0.05)
        atr_pct = latest.get('ATR_Pct', 0.02)
        momentum_5 = latest.get('Momentum_5', 0)

        # Regime classification
        vol_percentile = min(99, max(1, (vol_10 / 0.5) * 100))

        if vol_10 < 0.15:
            regime = "LOW_VOLATILITY"
            regime_label = "Low Volatility"
            regime_color = "green"
            reasoning.append(f"10-day annualized volatility at {vol_10*100:.1f}% — calm market environment. Trending conditions favorable.")
        elif vol_10 < 0.30:
            regime = "NORMAL"
            regime_label = "Normal Volatility"
            regime_color = "yellow"
            reasoning.append(f"Volatility at {vol_10*100:.1f}% annualized — within normal trading range. Standard position sizing appropriate.")
        elif vol_10 < 0.50:
            regime = "HIGH_VOLATILITY"
            regime_label = "Elevated Volatility"
            regime_color = "orange"
            reasoning.append(f"10-day vol at {vol_10*100:.1f}% — elevated. Wide swings expected. Reduce position size, widen stops.")
        else:
            regime = "EXTREME_VOLATILITY"
            regime_label = "Extreme Volatility"
            regime_color = "red"
            reasoning.append(f"EXTREME volatility at {vol_10*100:.1f}% annualized — crisis-level. Consider hedging or reducing exposure.")

        # Vol expansion/contraction
        if vol_10 > vol_30 * 1.3:
            reasoning.append(f"Short-term vol ({vol_10*100:.1f}%) significantly above 30d average ({vol_30*100:.1f}%) — volatility expanding. Breakout conditions possible.")
            vol_trend = "EXPANDING"
        elif vol_10 < vol_30 * 0.7:
            reasoning.append(f"Short-term vol ({vol_10*100:.1f}%) compressing below 30d average ({vol_30*100:.1f}%) — volatility contraction. Potential coiling before breakout.")
            vol_trend = "CONTRACTING"
        else:
            reasoning.append(f"Volatility stable: 10d {vol_10*100:.1f}% vs 30d {vol_30*100:.1f}% — no significant regime shift.")
            vol_trend = "STABLE"

        # ATR context
        reasoning.append(f"ATR represents {atr_pct*100:.2f}% of price — {'large' if atr_pct > 0.03 else 'moderate' if atr_pct > 0.015 else 'tight'} daily range. Stop placement should account for this.")

        # Bollinger squeeze
        if bb_width < 0.03:
            reasoning.append("Bollinger Band width extremely compressed — volatility squeeze detected. High probability of imminent directional breakout.")
        elif bb_width > 0.1:
            reasoning.append("Bollinger Bands expanded widely — high-volatility environment confirmed. Fade extreme moves rather than chase.")

        # Risk recommendation
        if regime in ["HIGH_VOLATILITY", "EXTREME_VOLATILITY"]:
            risk_rec = "REDUCE_EXPOSURE"
            decision = "HOLD"
        elif regime == "LOW_VOLATILITY" and vol_trend == "CONTRACTING":
            risk_rec = "PREPARE_FOR_BREAKOUT"
            decision = "BUY" if momentum_5 > 0 else "SELL"
        else:
            risk_rec = "STANDARD"
            decision = "BUY" if momentum_5 > 0 else ("SELL" if momentum_5 < -0.02 else "HOLD")

        return {
            "agent": "Volatility",
            "decision": decision,
            "regime": regime,
            "regime_label": regime_label,
            "regime_color": regime_color,
            "vol_trend": vol_trend,
            "risk_recommendation": risk_rec,
            "confidence": round(min(88, 40 + abs(vol_10 - 0.25) * 200), 1),
            "metrics": {
                "volatility_10d": round(vol_10 * 100, 2),
                "volatility_30d": round(vol_30 * 100, 2),
                "bb_width": round(bb_width * 100, 2),
                "atr_pct": round(atr_pct * 100, 3),
                "vol_percentile": round(vol_percentile, 1)
            },
            "reasoning": reasoning,
            "summary": f"Market regime: {regime_label} ({vol_trend}). Volatility at {vol_10*100:.1f}% annualized. Risk recommendation: {risk_rec}."
        }


class MPFCoTOrchestrator:
    def __init__(self):
        self.technical = TechnicalAgent()
        self.sentiment = SentimentAgent()
        self.volatility = VolatilityAgent()

    async def run(self, features_df: pd.DataFrame, raw_df: pd.DataFrame, ticker: str) -> dict:
        """Run all agents concurrently"""
        t_result, s_result, v_result = await asyncio.gather(
            asyncio.to_thread(self.technical.analyze, features_df),
            asyncio.to_thread(self.sentiment.analyze, features_df),
            asyncio.to_thread(self.volatility.analyze, features_df)
        )

        return {
            "technical": t_result,
            "sentiment": s_result,
            "volatility": v_result
        }

    def aggregate_decision(self, predictions: dict, analysis: dict) -> dict:
        """Weighted aggregation of all signals"""
        WEIGHTS = {
            "xgboost": 0.25,
            "lstm": 0.15,
            "technical": 0.30,
            "sentiment": 0.15,
            "volatility": 0.15
        }

        def signal_score(decision: str) -> float:
            return {"BUY": 1.0, "HOLD": 0.0, "SELL": -1.0}.get(decision, 0.0)

        scores = {
            "xgboost": signal_score(predictions.get("xgboost", {}).get("direction", "HOLD")),
            "lstm": signal_score(predictions.get("lstm", {}).get("direction", "HOLD")),
            "technical": signal_score(analysis.get("technical", {}).get("decision", "HOLD")),
            "sentiment": signal_score(analysis.get("sentiment", {}).get("decision", "HOLD")),
            "volatility": signal_score(analysis.get("volatility", {}).get("decision", "HOLD")),
        }

        weighted_score = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)

        if weighted_score >= 0.35:
            final_decision = "BUY"
        elif weighted_score <= -0.35:
            final_decision = "SELL"
        else:
            final_decision = "HOLD"

        confidence = min(97, max(20, abs(weighted_score) * 80 + 30))

        # Regime override
        regime = analysis.get("volatility", {}).get("regime", "NORMAL")
        if regime == "EXTREME_VOLATILITY" and final_decision != "HOLD":
            final_decision = "HOLD"
            confidence *= 0.7

        # Build combined reasoning
        cot_reasoning = []
        cot_reasoning.append(f"[XGBoost] {predictions.get('xgboost', {}).get('direction', 'N/A')} — return prediction {predictions.get('xgboost', {}).get('return_prediction', 0):.2f}%, confidence {predictions.get('xgboost', {}).get('direction_confidence', 0):.1f}%")
        cot_reasoning.append(f"[LSTM] {predictions.get('lstm', {}).get('direction', 'N/A')} — predicted price ${predictions.get('lstm', {}).get('predicted_price', 0):.2f} (change: {predictions.get('lstm', {}).get('price_change_pct', 0):.2f}%)")
        cot_reasoning.append(f"[Technical] {analysis.get('technical', {}).get('summary', '')}")
        cot_reasoning.append(f"[Sentiment] {analysis.get('sentiment', {}).get('summary', '')}")
        cot_reasoning.append(f"[Volatility] {analysis.get('volatility', {}).get('summary', '')}")
        cot_reasoning.append(f"[Aggregator] Weighted score: {weighted_score:.3f} → Final Decision: {final_decision} @ {confidence:.0f}% confidence")

        signal_breakdown = {k: {"score": v, "weight": WEIGHTS[k], "weighted": round(v * WEIGHTS[k], 3)} for k, v in scores.items()}

        return {
            "decision": final_decision,
            "confidence": round(confidence, 1),
            "weighted_score": round(weighted_score, 4),
            "signal_breakdown": signal_breakdown,
            "cot_reasoning": cot_reasoning,
            "regime": regime,
            "risk_level": "HIGH" if regime in ["HIGH_VOLATILITY", "EXTREME_VOLATILITY"] else "NORMAL"
        }
