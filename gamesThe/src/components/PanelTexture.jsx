export default function PanelTexture({ clubs }) {
  return (
    <div className="crest-cloud" aria-hidden="true">
      {clubs.map((club, index) => (
        <img
          key={club.id}
          src={club.crest}
          alt=""
          style={{
            left: `${3 + ((index * 31) % 91)}%`,
            top: `${2 + ((index * 47) % 88)}%`,
            transform: `rotate(${(index % 7) * 7 - 21}deg)`,
          }}
        />
      ))}
    </div>
  );
}
