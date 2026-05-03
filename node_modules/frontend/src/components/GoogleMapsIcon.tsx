/** ไอคอนสไตล์หมุดแผนที่ (ใช้แสดงลิงก์ Google Maps) */
export function GoogleMapsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={24}
      height={24}
      aria-hidden
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
      />
      <path
        fill="#34A853"
        d="M12 6.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"
        opacity={0.95}
      />
      <circle fill="#fff" cx="12" cy="9" r={2.2} />
    </svg>
  );
}
