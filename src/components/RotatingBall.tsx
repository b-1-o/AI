type RotatingBallProps = {
  src: string
  active: boolean
  opacity: number
}

export default function RotatingBall({ src, active, opacity }: RotatingBallProps) {
  return (
    <div
      className="rotating-ball"
      aria-hidden="true"
      style={{
        opacity: active ? opacity : 0,
      }}
    >
      <div className="rotating-ball__stage">
        <img className="rotating-ball__surface" src={src} alt="" />
      </div>
    </div>
  )
}
