import type { InferenceResult } from '../utils/inference'

interface PredictionDisplayProps {
  result: InferenceResult | null
}

// 最大確率に応じた強調色
const HIGH_COLOR   = '#ff9500'   // 高確信（Bloom と同系）
const NORMAL_COLOR = '#4a90e2'   // 通常バー
const DIM_COLOR    = '#1e2a4a'   // 非選択バー

export default function PredictionDisplay({ result }: PredictionDisplayProps) {
  if (!result) {
    return (
      <div style={styles.placeholder}>
        Run を押して推論を実行
      </div>
    )
  }

  const { prediction, probabilities } = result
  const confidence = probabilities[prediction]
  const digitColor = confidence > 0.8 ? HIGH_COLOR : '#ccd6ff'

  return (
    <div style={styles.container}>
      {/* 予測数字 */}
      <div style={styles.predictionRow}>
        <span style={{ ...styles.digit, color: digitColor }}>
          {prediction}
        </span>
        <span style={styles.confidence}>
          {(confidence * 100).toFixed(1)}%
        </span>
      </div>

      {/* 確率分布バー */}
      <div style={styles.bars}>
        {probabilities.map((prob, digit) => {
          const isTop = digit === prediction
          const pct   = (prob * 100).toFixed(1)
          return (
            <div key={digit} style={styles.barRow}>
              <span style={{ ...styles.barLabel, color: isTop ? HIGH_COLOR : '#8899bb' }}>
                {digit}
              </span>
              <div style={styles.barTrack}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${prob * 100}%`,
                    background: isTop ? HIGH_COLOR : NORMAL_COLOR,
                    boxShadow: isTop ? `0 0 6px ${HIGH_COLOR}88` : 'none',
                  }}
                />
                {/* 非選択の残りを暗く */}
                <div style={{ ...styles.barRemainder, background: DIM_COLOR }} />
              </div>
              <span style={{ ...styles.barPct, color: isTop ? HIGH_COLOR : '#556080' }}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------

const styles = {
  placeholder: {
    marginTop: 24,
    fontSize: 13,
    color: '#445070',
    textAlign: 'center',
  } satisfies React.CSSProperties,

  container: {
    marginTop: 24,
    width: 280,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  } satisfies React.CSSProperties,

  predictionRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
  } satisfies React.CSSProperties,

  digit: {
    fontSize: 64,
    fontWeight: 700,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    transition: 'color 0.3s',
  } satisfies React.CSSProperties,

  confidence: {
    fontSize: 18,
    color: '#8899bb',
    fontVariantNumeric: 'tabular-nums',
  } satisfies React.CSSProperties,

  bars: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  } satisfies React.CSSProperties,

  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } satisfies React.CSSProperties,

  barLabel: {
    width: 12,
    fontSize: 11,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
    flexShrink: 0,
  } satisfies React.CSSProperties,

  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    display: 'flex',
    background: DIM_COLOR,
  } satisfies React.CSSProperties,

  barFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.4s ease',
    flexShrink: 0,
  } satisfies React.CSSProperties,

  barRemainder: {
    flex: 1,
    height: '100%',
  } satisfies React.CSSProperties,

  barPct: {
    width: 38,
    fontSize: 10,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
    flexShrink: 0,
  } satisfies React.CSSProperties,
}
