# -*- coding: utf-8 -*-
import streamlit as st
import sqlite3
import json
import uuid
import time
import io
import qrcode
from PIL import Image
from datetime import datetime, timedelta
import pandas as pd

# Page Configuration
st.set_page_config(
    page_title="SeatSwift | Ticket Booking & Concurrency Engine",
    page_icon="???",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown('''
<style>
    .screen-curve {
        height: 14px;
        background: linear-gradient(90deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.9), rgba(99, 102, 241, 0.1));
        border-radius: 50% / 100% 100% 0 0;
        box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5);
        margin: 20px auto 10px auto;
        width: 80%;
    }
    .screen-text {
        text-align: center;
        font-size: 11px;
        letter-spacing: 4px;
        color: #64748b;
        font-weight: 700;
        margin-bottom: 25px;
    }
    div.stButton > button {
        border-radius: 12px;
        font-weight: 600;
    }
</style>
''', unsafe_allow_html=True)

DB_FILE = "seatswift_streamlit.db"

def get_db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS venues (id TEXT PRIMARY KEY, name TEXT, city TEXT, address TEXT, total_rows INTEGER, total_cols INTEGER)")
    c.execute("CREATE TABLE IF NOT EXISTS venue_seats (id TEXT PRIMARY KEY, venue_id TEXT, row TEXT, col INTEGER, seat_number TEXT, category TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, title TEXT, description TEXT, category TEXT, banner_url TEXT, duration_minutes INTEGER, venue_id TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS showtimes (id TEXT PRIMARY KEY, event_id TEXT, start_time TEXT, end_time TEXT, hold_ttl_minutes INTEGER DEFAULT 10, pricing_json TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS show_seats (id TEXT PRIMARY KEY, showtime_id TEXT, venue_seat_id TEXT, seat_number TEXT, row TEXT, col INTEGER, category TEXT, price REAL, status TEXT DEFAULT 'AVAILABLE', held_by_user TEXT, hold_expires_at TEXT, version INTEGER DEFAULT 0)")
    c.execute("CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, booking_ref TEXT UNIQUE, user_email TEXT, customer_name TEXT, showtime_id TEXT, total_amount REAL, status TEXT DEFAULT 'CONFIRMED', qr_code_data TEXT, created_at TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS booking_seats (id TEXT PRIMARY KEY, booking_id TEXT, show_seat_id TEXT, seat_number TEXT, category TEXT, price REAL)")
    c.execute("CREATE TABLE IF NOT EXISTS waitlist (id TEXT PRIMARY KEY, showtime_id TEXT, user_email TEXT, user_name TEXT, category TEXT, status TEXT DEFAULT 'WAITING', allocated_seat_id TEXT, claim_token TEXT UNIQUE, offer_expires_at TEXT, created_at TEXT)")

    c.execute("SELECT COUNT(*) as count FROM venues")
    if c.fetchone()['count'] == 0:
        v1_id = str(uuid.uuid4())
        c.execute("INSERT INTO venues VALUES (?, ?, ?, ?, ?, ?)", (v1_id, "IMAX Grand Dolby Theatre", "San Francisco", "780 Mission St", 5, 8))
        rows = ['A', 'B', 'C', 'D', 'E']
        for r_idx, r in enumerate(rows):
            cat = 'VIP' if r_idx == 0 else ('PREMIUM' if r_idx in [1, 2] else 'STANDARD')
            for col in range(1, 9):
                s_id = str(uuid.uuid4())
                c.execute("INSERT INTO venue_seats VALUES (?, ?, ?, ?, ?, ?)", (s_id, v1_id, r, col, f"{r}{col}", cat))
        
        e1_id = str(uuid.uuid4())
        c.execute("INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?)", (
            e1_id, "Dune: Part Two (IMAX 70mm)", "Paul Atreides unites with Chani and the Fremen while seeking revenge.", "MOVIE",
            "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop", 166, v1_id
        ))

        e2_id = str(uuid.uuid4())
        c.execute("INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?)", (
            e2_id, "Coldplay: Music of the Spheres", "Breathtaking lasers, wristbands, and live stadium world tour.", "CONCERT",
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop", 150, v1_id
        ))

        tomorrow = datetime.now() + timedelta(days=1)
        st1_id = str(uuid.uuid4())
        st1_time = tomorrow.replace(hour=19, minute=0, second=0).isoformat()
        pricing_1 = json.dumps({"VIP": 35.0, "PREMIUM": 25.0, "STANDARD": 18.0})
        c.execute("INSERT INTO showtimes VALUES (?, ?, ?, ?, ?, ?)", (st1_id, e1_id, st1_time, (tomorrow + timedelta(hours=3)).isoformat(), 10, pricing_1))

        c.execute("SELECT * FROM venue_seats WHERE venue_id = ?", (v1_id,))
        v_seats = c.fetchall()
        p_dict = {"VIP": 35.0, "PREMIUM": 25.0, "STANDARD": 18.0}
        for vs in v_seats:
            c.execute("INSERT INTO show_seats VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', NULL, NULL, 0)",
                      (str(uuid.uuid4()), st1_id, vs['id'], vs['seat_number'], vs['row'], vs['col'], vs['category'], p_dict.get(vs['category'], 18.0)))

        st2_id = str(uuid.uuid4())
        st2_time = tomorrow.replace(hour=21, minute=30, second=0).isoformat()
        pricing_2 = json.dumps({"VIP": 120.0, "PREMIUM": 75.0, "STANDARD": 45.0})
        c.execute("INSERT INTO showtimes VALUES (?, ?, ?, ?, ?, ?)", (st2_id, e2_id, st2_time, (tomorrow + timedelta(hours=3)).isoformat(), 10, pricing_2))
        p_dict2 = {"VIP": 120.0, "PREMIUM": 75.0, "STANDARD": 45.0}
        for vs in v_seats:
            c.execute("INSERT INTO show_seats VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', NULL, NULL, 0)",
                      (str(uuid.uuid4()), st2_id, vs['id'], vs['seat_number'], vs['row'], vs['col'], vs['category'], p_dict2.get(vs['category'], 45.0)))

    conn.commit()
    conn.close()

init_db()

def sweep_expired_holds():
    conn = get_db()
    c = conn.cursor()
    now_iso = datetime.now().isoformat()
    c.execute("UPDATE show_seats SET status = 'AVAILABLE', held_by_user = NULL, hold_expires_at = NULL, version = version + 1 WHERE status = 'HELD' AND hold_expires_at < ?", (now_iso,))
    c.execute("SELECT * FROM waitlist WHERE status = 'OFFERED' AND offer_expires_at < ?", (now_iso,))
    for off in c.fetchall():
        c.execute("UPDATE waitlist SET status = 'EXPIRED' WHERE id = ?", (off['id'],))
        if off['allocated_seat_id']:
            reallocate_seat_to_waitlist_db(off['showtime_id'], off['allocated_seat_id'], off['category'])
    conn.commit()
    conn.close()

def reallocate_seat_to_waitlist_db(showtime_id, seat_id, category):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM waitlist WHERE showtime_id = ? AND status = 'WAITING' AND (category = ? OR category = 'ANY') ORDER BY created_at ASC LIMIT 1", (showtime_id, category))
    candidate = c.fetchone()
    if candidate:
        token = str(uuid.uuid4())
        expires = (datetime.now() + timedelta(minutes=10)).isoformat()
        c.execute("UPDATE waitlist SET status = 'OFFERED', allocated_seat_id = ?, claim_token = ?, offer_expires_at = ? WHERE id = ?", (seat_id, token, expires, candidate['id']))
        c.execute("UPDATE show_seats SET status = 'HELD', held_by_user = ?, hold_expires_at = ?, version = version + 1 WHERE id = ?", (candidate['user_email'], expires, seat_id))
    else:
        c.execute("UPDATE show_seats SET status = 'AVAILABLE', held_by_user = NULL, hold_expires_at = NULL, version = version + 1 WHERE id = ?", (seat_id,))
    conn.commit()
    conn.close()

def hold_seats_atomic(showtime_id, seat_ids, user_email, ttl_minutes=10):
    conn = get_db()
    c = conn.cursor()
    now_iso = datetime.now().isoformat()
    expires_iso = (datetime.now() + timedelta(minutes=ttl_minutes)).isoformat()
    c.execute("BEGIN IMMEDIATE")
    try:
        placeholders = ','.join(['?'] * len(seat_ids))
        c.execute(f"SELECT * FROM show_seats WHERE id IN ({placeholders})", seat_ids)
        seats = c.fetchall()
        conflicts = [s['seat_number'] for s in seats if s['status'] == 'BOOKED' or (s['status'] == 'HELD' and s['held_by_user'] != user_email and s['hold_expires_at'] > now_iso)]
        if conflicts:
            conn.rollback()
            return False, f"Seats {', '.join(conflicts)} are held/booked by another customer."
        c.execute(f"UPDATE show_seats SET status = 'HELD', held_by_user = ?, hold_expires_at = ?, version = version + 1 WHERE id IN ({placeholders})", [user_email, expires_iso] + seat_ids)
        conn.commit()
        return True, expires_iso
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        conn.close()

def confirm_booking_db(showtime_id, seat_ids, user_email, customer_name):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("BEGIN IMMEDIATE")
        placeholders = ','.join(['?'] * len(seat_ids))
        c.execute(f"SELECT * FROM show_seats WHERE id IN ({placeholders})", seat_ids)
        seats = c.fetchall()
        total_amount = sum(s['price'] for s in seats)
        booking_ref = "BK-" + uuid.uuid4().hex[:8].upper()
        qr_payload = json.dumps({"ref": booking_ref, "showtimeId": showtime_id, "seats": [s['seat_number'] for s in seats], "customer": user_email, "total": total_amount})
        booking_id = str(uuid.uuid4())
        c.execute("INSERT INTO bookings VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?)", (booking_id, booking_ref, user_email, customer_name, showtime_id, total_amount, qr_payload, datetime.now().isoformat()))
        for s in seats:
            c.execute("INSERT INTO booking_seats VALUES (?, ?, ?, ?, ?, ?)", (str(uuid.uuid4()), booking_id, s['id'], s['seat_number'], s['category'], s['price']))
        c.execute(f"UPDATE show_seats SET status = 'BOOKED', held_by_user = NULL, hold_expires_at = NULL, version = version + 1 WHERE id IN ({placeholders})", seat_ids)
        conn.commit()
        return True, booking_ref, qr_payload, total_amount
    except Exception as e:
        conn.rollback()
        return False, str(e), None, 0
    finally:
        conn.close()

def cancel_booking_db(booking_id):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
        b = c.fetchone()
        if not b or b['status'] == 'CANCELLED': return False, "Already cancelled"
        c.execute("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?", (booking_id,))
        c.execute("SELECT * FROM booking_seats WHERE booking_id = ?", (booking_id,))
        seats = c.fetchall()
        conn.commit()
        conn.close()
        for s in seats:
            reallocate_seat_to_waitlist_db(b['showtime_id'], s['show_seat_id'], s['category'])
        return True, "Booking cancelled and seats auto-reallocated to waitlist."
    except Exception as e:
        return False, str(e)

def generate_qr_image(payload_str):
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(payload_str)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

sweep_expired_holds()

if "user_email" not in st.session_state: st.session_state.user_email = "customer@seatswift.com"
if "user_name" not in st.session_state: st.session_state.user_name = "Alex Johnson"
if "user_role" not in st.session_state: st.session_state.user_role = "Customer"
if "selected_seats" not in st.session_state: st.session_state.selected_seats = []
if "hold_expires_at" not in st.session_state: st.session_state.hold_expires_at = None

with st.sidebar:
    st.markdown("### \U0001F39F SeatSwift Hub")
    st.caption("Ticket Booking & Concurrency Engine")
    st.divider()
    role = st.selectbox("Role Persona", ["Customer", "Organiser", "Admin"])
    if role != st.session_state.user_role:
        st.session_state.user_role = role
        if role == "Customer":
            st.session_state.user_email = "customer@seatswift.com"
            st.session_state.user_name = "Alex Johnson"
        elif role == "Organiser":
            st.session_state.user_email = "organiser@seatswift.com"
            st.session_state.user_name = "Grand Arena Organiser"
        else:
            st.session_state.user_email = "admin@seatswift.com"
            st.session_state.user_name = "System Admin"
        st.rerun()

    st.info(f"Persona: {st.session_state.user_name} | {st.session_state.user_email}")
    st.divider()
    st.success("Engine: Locks Active | Hold TTL Active | Waitlist Ready")

if st.session_state.user_role == "Customer":
    tab1, tab2, tab3, tab4 = st.tabs(["\U0001F3AC Book Seats", "\U0001F39F My Tickets", "\U000023F3 Waitlist", "\U0001F9EA Concurrency Test"])

    with tab1:
        st.markdown("## \U0001F3AC Live Events & Visual Seat Selection")
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT events.*, venues.name as venue_name, venues.city as venue_city FROM events JOIN venues ON events.venue_id = venues.id")
        events = c.fetchall()

        col1, col2 = st.columns([1, 2])
        with col1:
            sel_ev_idx = st.selectbox("Select Event:", range(len(events)), format_func=lambda i: events[i]['title'])
            event = events[sel_ev_idx]
            st.image(event['banner_url'], use_container_width=True)
            st.markdown(f"**Venue:** {event['venue_name']} ({event['venue_city']})")
            st.write(event['description'])

        with col2:
            c.execute("SELECT * FROM showtimes WHERE event_id = ?", (event['id'],))
            showtimes = c.fetchall()
            if showtimes:
                st_idx = st.selectbox("Showtime:", range(len(showtimes)), format_func=lambda i: datetime.fromisoformat(showtimes[i]['start_time']).strftime('%a, %b %d \u2022 %I:%M %p'))
                showtime = showtimes[st_idx]
                st_id = showtime['id']
                pricing = json.loads(showtime['pricing_json'])

                c.execute("SELECT * FROM show_seats WHERE showtime_id = ? ORDER BY row ASC, col ASC", (st_id,))
                show_seats = c.fetchall()
                avail_count = sum(1 for s in show_seats if s['status'] == 'AVAILABLE')

                st.markdown('<div class="screen-curve"></div><div class="screen-text">STAGE / SCREEN</div>', unsafe_allow_html=True)
                st.markdown("<div style='text-align:center; font-size:12px; margin-bottom:10px;'>\U0001F7E2 Available | \U0001F7E1 Held (TTL) | \U0001F534 Booked | \U0001F7E3 Selected</div>", unsafe_allow_html=True)

                rows = sorted(list(set(s['row'] for s in show_seats)))
                for r in rows:
                    cols_in_row = [s for s in show_seats if s['row'] == r]
                    grid_cols = st.columns([1] + [1] * len(cols_in_row) + [1])
                    grid_cols[0].markdown(f"**{r}**")
                    for c_idx, seat in enumerate(cols_in_row):
                        s_id = seat['id']
                        status = seat['status']
                        is_sel = s_id in st.session_state.selected_seats
                        is_my_hold = (status == 'HELD' and seat['held_by_user'] == st.session_state.user_email)
                        
                        if status == 'BOOKED':
                            grid_cols[c_idx+1].button(f"\U0000274C {seat['seat_number']}", key=f"s_{s_id}", disabled=True)
                        elif status == 'HELD' and not is_my_hold:
                            grid_cols[c_idx+1].button(f"\U000023F3 {seat['seat_number']}", key=f"s_{s_id}", disabled=True)
                        else:
                            style = "\U0001F7E3 " if is_sel or is_my_hold else "\U0001F7E2 "
                            if grid_cols[c_idx+1].button(f"{style}{seat['seat_number']}", key=f"s_{s_id}", help=f"{seat['category']} - ${seat['price']}"):
                                if is_sel: st.session_state.selected_seats.remove(s_id)
                                else: st.session_state.selected_seats.append(s_id)
                                st.rerun()
                    grid_cols[-1].markdown(f"**{r}**")

                if st.session_state.selected_seats:
                    c.execute(f"SELECT * FROM show_seats WHERE id IN ({','.join(['?']*len(st.session_state.selected_seats))})", st.session_state.selected_seats)
                    sel_data = c.fetchall()
                    tot = sum(s['price'] for s in sel_data)
                    st.markdown(f"#### Selected: **{', '.join(s['seat_number'] for s in sel_data)}** | Total: **${tot:.2f}**")
                    
                    b1, b2 = st.columns(2)
                    with b1:
                        if st.button("\U0001F512 Hold Selected Seats (10m TTL)", type="primary", use_container_width=True):
                            ok, res = hold_seats_atomic(st_id, st.session_state.selected_seats, st.session_state.user_email)
                            if ok:
                                st.session_state.hold_expires_at = res
                                st.success(f"Held until {datetime.fromisoformat(res).strftime('%I:%M:%S %p')}!")
                                st.rerun()
                            else: st.error(res)
                    with b2:
                        if st.button("\U0001F4B3 Confirm Checkout & Generate QR Ticket", use_container_width=True):
                            ok, b_ref, qr_data, amt = confirm_booking_db(st_id, st.session_state.selected_seats, st.session_state.user_email, st.session_state.user_name)
                            if ok:
                                st.session_state.selected_seats = []
                                st.session_state.hold_expires_at = None
                                st.balloons()
                                st.success(f"\U0001F389 Confirmed! Ref: **{b_ref}**")
                                qr_bytes = generate_qr_image(qr_data)
                                st.image(qr_bytes, width=200, caption="Entry QR Code")
                                st.download_button("\U0001F4E5 Download QR Pass", qr_bytes, file_name=f"ticket_{b_ref}.png", mime="image/png")
                            else: st.error(res)
                elif avail_count == 0:
                    st.warning("Showtime Sold Out!")
                    if st.button("Join Waitlist"):
                        c.execute("INSERT INTO waitlist VALUES (?, ?, ?, ?, 'ANY', 'WAITING', NULL, NULL, NULL, ?)",
                                  (str(uuid.uuid4()), st_id, st.session_state.user_email, st.session_state.user_name, datetime.now().isoformat()))
                        conn.commit()
                        st.success("Joined waitlist!")
        conn.close()

    with tab2:
        st.markdown("## \U0001F39F My Bookings & QR Passes")
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT bookings.*, events.title as event_title, showtimes.start_time, venues.name as venue_name FROM bookings JOIN showtimes ON bookings.showtime_id = showtimes.id JOIN events ON showtimes.event_id = events.id JOIN venues ON events.venue_id = venues.id WHERE bookings.user_email = ? ORDER BY bookings.created_at DESC", (st.session_state.user_email,))
        my_bookings = c.fetchall()
        if not my_bookings:
            st.info("No bookings recorded.")
        else:
            for b in my_bookings:
                with st.expander(f"\U0001F39F {b['event_title']} \u2014 Ref: {b['booking_ref']} ({b['status']})", expanded=(b['status'] == 'CONFIRMED')):
                    c.execute("SELECT * FROM booking_seats WHERE booking_id = ?", (b['id'],))
                    seats = c.fetchall()
                    st.markdown(f"**Showtime:** {datetime.fromisoformat(b['start_time']).strftime('%b %d \u2022 %I:%M %p')} | **Seats:** {', '.join(s['seat_number'] for s in seats)}")
                    if b['status'] == 'CONFIRMED':
                        if st.button("Cancel Booking", key=f"c_{b['id']}"):
                            cancel_booking_db(b['id'])
                            st.rerun()
                        qr_bytes = generate_qr_image(b['qr_code_data'])
                        st.image(qr_bytes, width=150)
                        st.download_button("Download QR Pass", qr_bytes, file_name=f"ticket_{b['booking_ref']}.png", mime="image/png", key=f"dl_{b['id']}")
        conn.close()

    with tab3:
        st.markdown("## \U000023F3 Waitlist Claim Portal")
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT waitlist.*, events.title as event_title, show_seats.seat_number FROM waitlist JOIN showtimes ON waitlist.showtime_id = showtimes.id JOIN events ON showtimes.event_id = events.id LEFT JOIN show_seats ON waitlist.allocated_seat_id = show_seats.id WHERE waitlist.user_email = ? ORDER BY waitlist.created_at DESC", (st.session_state.user_email,))
        my_w = c.fetchall()
        if not my_w: st.info("No active waitlist entries.")
        else:
            for w in my_w:
                st.markdown(f"### {w['event_title']} \u2014 Status: `{w['status']}`")
                if w['status'] == 'OFFERED':
                    st.success(f"Seat **{w['seat_number']}** is reserved for you until {datetime.fromisoformat(w['offer_expires_at']).strftime('%I:%M:%S %p')}!")
                    if st.button("Claim & Confirm", key=f"claim_{w['id']}", type="primary"):
                        ok, b_ref, qr_data, amt = confirm_booking_db(w['showtime_id'], [w['allocated_seat_id']], st.session_state.user_email, st.session_state.user_name)
                        if ok:
                            c.execute("UPDATE waitlist SET status = 'CLAIMED' WHERE id = ?", (w['id'],))
                            conn.commit()
                            st.balloons()
                            st.success(f"Claimed! Ref: {b_ref}")
                            st.rerun()
        conn.close()

    with tab4:
        st.markdown("## \U0001F9EA Live Concurrency Test")
        if st.button("Run Concurrency Test (10 Parallel Users)"):
            import concurrent.futures
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT * FROM show_seats LIMIT 1")
            target = c.fetchone()
            c.execute("UPDATE show_seats SET status = 'AVAILABLE', held_by_user = NULL, hold_expires_at = NULL WHERE id = ?", (target['id'],))
            conn.commit()
            conn.close()

            def attempt(uid): return hold_seats_atomic(target['showtime_id'], [target['id']], f"user_{uid}@test.com")
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
                res = list(ex.map(attempt, range(1, 11)))
            succ = sum(1 for ok, _ in res if ok)
            fail = sum(1 for ok, _ in res if not ok)
            st.metric("Successful Holds", succ)
            st.metric("Rejected Race-Condition Conflicts", fail)
            if succ == 1 and fail == 9: st.success("\U0001F3C6 Exactly 1 user held the seat, 9 were rejected!")

elif st.session_state.user_role == "Organiser":
    st.markdown("## \U0001F4CA Organiser Revenue & Occupancy Dashboard")
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT SUM(total_amount) as rev, COUNT(*) as cnt FROM bookings WHERE status = 'CONFIRMED'")
    r = c.fetchone()
    c.execute("SELECT COUNT(*) as wait_cnt FROM waitlist WHERE status = 'WAITING'")
    w_cnt = c.fetchone()['wait_cnt'] or 0
    c.execute("SELECT COUNT(*) as total_seats FROM show_seats")
    tot_s = c.fetchone()['total_seats'] or 1
    c.execute("SELECT COUNT(*) as booked_seats FROM show_seats WHERE status = 'BOOKED'")
    bk_s = c.fetchone()['booked_seats'] or 0

    k1, k2, k3, k4 = st.columns(4)
    k1.metric("Total Revenue", f"${(r['rev'] or 0.0):,.2f}")
    k2.metric("Tickets Sold", f"{bk_s} / {tot_s}")
    k3.metric("Occupancy", f"{(bk_s/tot_s)*100:.1f}%")
    k4.metric("Active Waitlist", w_cnt)
    st.divider()
    c.execute("SELECT bookings.booking_ref, bookings.customer_name, bookings.total_amount, bookings.created_at, events.title FROM bookings JOIN showtimes ON bookings.showtime_id = showtimes.id JOIN events ON showtimes.event_id = events.id WHERE bookings.status = 'CONFIRMED' ORDER BY bookings.created_at DESC")
    st.dataframe(pd.DataFrame([dict(row) for row in c.fetchall()]), use_container_width=True)
    conn.close()

elif st.session_state.user_role == "Admin":
    st.markdown("## \U0001F3DB\U0000FE0F Admin Venue Builder")
    conn = get_db()
    c = conn.cursor()
    with st.form("new_v"):
        vn = st.text_input("Venue Name", "Grand Cinema Palace")
        vc = st.text_input("City", "New York")
        va = st.text_input("Address", "Broadway Ave")
        vr = st.number_input("Rows", min_value=2, max_value=8, value=5)
        vcol = st.number_input("Cols", min_value=4, max_value=10, value=8)
        if st.form_submit_button("Create Venue"):
            v_id = str(uuid.uuid4())
            c.execute("INSERT INTO venues VALUES (?, ?, ?, ?, ?, ?)", (v_id, vn, vc, va, vr, vcol))
            rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
            for r_i in range(vr):
                cat = 'VIP' if r_i == 0 else ('PREMIUM' if r_i in [1, 2] else 'STANDARD')
                for c_i in range(1, vcol+1):
                    c.execute("INSERT INTO venue_seats VALUES (?, ?, ?, ?, ?, ?)", (str(uuid.uuid4()), v_id, rows[r_i], c_i, f"{rows[r_i]}{c_i}", cat))
            conn.commit()
            st.success("Venue created!")
            st.rerun()
    conn.close()
