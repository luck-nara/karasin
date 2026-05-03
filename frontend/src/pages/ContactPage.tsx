export function ContactPage() {
  return (
    <section className="contactPage panel">
      <div className="panelHeader">
        <div className="panelTitle">ติดต่อ</div>
      </div>
      <div className="panelBody stack">
        <p className="muted">
          หากต้องการสอบถามข้อมูลการท่องเที่ยวหรือความร่วมมือ สามารถติดต่อได้ที่ช่องทางด้านล่าง
        </p>
        <div className="contactGrid">
          <div className="factCard">
            <div className="detailLabel">อีเมล</div>
            <div>hello@karasin-travel.example</div>
          </div>
          <div className="factCard">
            <div className="detailLabel">โทรศัพท์</div>
            <div>043-000-0000</div>
          </div>
          <div className="factCard">
            <div className="detailLabel">ที่อยู่</div>
            <div>จังหวัดกาฬสินธุ์ ประเทศไทย</div>
          </div>
        </div>
      </div>
    </section>
  );
}
