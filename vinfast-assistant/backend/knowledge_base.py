"""
VinFast VF8/VF9 Knowledge Base
31 structured chunks covering 7 categories.
"""
from dataclasses import dataclass
from typing import Literal

@dataclass
class Chunk:
    id: str
    page_number: int
    chapter: str
    section: str
    content: str
    car_model: Literal["VF8", "VF9"]
    category: Literal["adas", "charging", "warning", "operation", "safety", "maintenance", "specification"]
    embedding: list[float] | None = None

KNOWLEDGE_BASE: list[Chunk] = [
    # ── ADAS ──────────────────────────────────────────
    Chunk(
        id="adas-001", page_number=112,
        chapter="Advanced Driver Assistance Systems",
        section="Lane Keeping Assist (LKA)",
        content="Lane Keeping Assist monitors the vehicle position within lane markers using a forward-facing camera. When the car drifts toward a lane boundary without signaling, LKA applies gentle steering correction to guide it back. If the driver does not respond, an audible and visual warning alerts them to take corrective action immediately. The system operates above 60 km/h.",
        car_model="VF8", category="adas"
    ),
    Chunk(
        id="adas-002", page_number=113,
        chapter="Advanced Driver Assistance Systems",
        section="Lane Departure Warning (LDW)",
        content="Lane Departure Warning detects lane markings ahead and warns the driver through steering wheel vibration and a visual indicator when the vehicle crosses them without the turn signal active. The system operates at speeds above 60 km/h and can be temporarily disabled via the infotainment menu under Settings → Safety.",
        car_model="VF8", category="adas"
    ),
    Chunk(
        id="adas-003", page_number=115,
        chapter="Advanced Driver Assistance Systems",
        section="Adaptive Cruise Control (ACC)",
        content="Adaptive Cruise Control maintains a driver-selected following distance from the vehicle ahead by automatically adjusting speed up to the set limit. ACC uses radar and camera fusion to detect preceding traffic and can bring the VF8 to a complete stop, then resume, in congested conditions. Activate ACC with the steering wheel stalk; press SET− to confirm speed.",
        car_model="VF8", category="adas"
    ),
    Chunk(
        id="adas-004", page_number=116,
        chapter="Advanced Driver Assistance Systems",
        section="Traffic Jam Assist",
        content="Traffic Jam Assist combines ACC and LKA to provide semi-automated steering and speed control in stop-and-go traffic at speeds below 60 km/h. The driver must keep hands on the steering wheel; the system issues alerts within seconds if hands are detected off the wheel. Always monitor road conditions and be prepared to intervene.",
        car_model="VF8", category="adas"
    ),
    Chunk(
        id="adas-005", page_number=118,
        chapter="Advanced Driver Assistance Systems",
        section="Blind Spot Monitoring (BSM)",
        content="Blind Spot Monitoring uses rear radar sensors to detect vehicles in adjacent lanes that may not be visible in the side mirrors. When a vehicle enters the blind spot zone, an illuminated indicator appears in the corresponding mirror housing. If the turn signal is activated while a vehicle is detected, the system flashes the indicator and emits a warning tone.",
        car_model="VF8", category="adas"
    ),
    Chunk(
        id="adas-006", page_number=120,
        chapter="Advanced Driver Assistance Systems",
        section="Automatic Emergency Braking (AEB)",
        content="Automatic Emergency Braking detects imminent forward collisions with vehicles, pedestrians, or cyclists and provides audible and visual warnings before applying full braking force if the driver does not react. AEB operates from 5 km/h up to 150 km/h and is designed to mitigate or avoid collisions; it does not guarantee complete stopping in all conditions.",
        car_model="VF8", category="adas"
    ),
    Chunk(
        id="adas-007", page_number=122,
        chapter="Advanced Driver Assistance Systems",
        section="Forward Collision Warning (FCW)",
        content="Forward Collision Warning continuously monitors the gap to the vehicle directly ahead using forward-facing sensors. When the time-to-collision falls below a threshold, a red warning icon appears on the instrument cluster along with an audible alert. FCW is active even when ACC is turned off.",
        car_model="VF9", category="adas"
    ),
    Chunk(
        id="adas-008", page_number=124,
        chapter="Advanced Driver Assistance Systems",
        section="Rear Cross Traffic Alert (RCTA)",
        content="Rear Cross Traffic Alert activates when the VF9 is in Reverse and warns of approaching vehicles or pedestrians crossing behind. Visual alerts appear on the centre display and rear camera image; audible beeps intensify as the object nears. RCTA is especially useful in parking lots where visibility is limited.",
        car_model="VF9", category="adas"
    ),
    # ── CHARGING ─────────────────────────────────────
    Chunk(
        id="chg-001", page_number=88,
        chapter="Battery & Charging",
        section="Slow Charging (AC)",
        content="Slow charging uses an AC home or public charger (up to 11 kW for VF8). Connect the charging cable to the CCS2 port on the driver-side rear fender, then initiate charging via the VinFast app or vehicle infotainment screen. A full charge from 10% to 100% on an 11 kW AC charger takes approximately 7–8 hours. Always use VinFast-approved cables.",
        car_model="VF8", category="charging"
    ),
    Chunk(
        id="chg-002", page_number=90,
        chapter="Battery & Charging",
        section="DC Fast Charging",
        content="DC fast charging delivers up to 150 kW to the VF8 battery, charging from 10% to 80% in approximately 24–30 minutes. Locate a VinFast Super Charging station via the VinFast app; align the CCS2 plug and press the charging port release button on the key fob. Charging automatically stops when the battery reaches 80% to preserve cell longevity.",
        car_model="VF8", category="charging"
    ),
    Chunk(
        id="chg-003", page_number=91,
        chapter="Battery & Charging",
        section="Battery Care Guidelines",
        content="To maximise battery lifespan, avoid regularly charging above 80% or discharging below 20% for daily use. High-temperature exposure accelerates degradation; park in shade when possible and avoid fast charging in ambient temperatures above 40°C. VinFast warrants the battery for 10 years / 200,000 km under normal use conditions.",
        car_model="VF8", category="charging"
    ),
    Chunk(
        id="chg-004", page_number=93,
        chapter="Battery & Charging",
        section="Charging Status Indicators",
        content="The charging port LED ring shows status: white indicates ready-to-charge, blinking green signals active charging, solid green means charge complete, red signals a fault that requires service contact. The instrument cluster also displays real-time battery percentage, estimated range, and projected full-charge time.",
        car_model="VF8", category="charging"
    ),
    Chunk(
        id="chg-005", page_number=95,
        chapter="Battery & Charging",
        section="Scheduled Charging via App",
        content="Open the VinFast app, navigate to Vehicle → Charging, and enable Scheduled Charging to take advantage of off-peak electricity rates. Set start time and desired charge limit. The vehicle will automatically begin charging at the scheduled time when plugged in; you can override via the app or the centre display.",
        car_model="VF9", category="charging"
    ),
    Chunk(
        id="chg-006", page_number=97,
        chapter="Battery & Charging",
        section="VF9 Battery Capacity",
        content="The VF9 is equipped with a 123 kWh lithium-ion battery pack providing an EPA-estimated range of up to 438 km per charge. Actual range varies with driving behaviour, climate control usage, ambient temperature, and road conditions. At highway speeds above 110 km/h, expect approximately 25–30% reduction in range versus city driving.",
        car_model="VF9", category="charging"
    ),
    # ── WARNING LIGHTS ────────────────────────────────
    Chunk(
        id="wrn-001", page_number=182,
        chapter="Instrument Cluster & Warning Lights",
        section="Check Engine Warning",
        content="The check engine light (amber engine icon) illuminates when the powertrain control system detects a fault. If solid, schedule service at the earliest convenience; if blinking, reduce speed and avoid high RPM as misfiring may cause catalytic converter damage. Use the VinFast app to read fault codes or contact roadside assistance.",
        car_model="VF8", category="warning"
    ),
    Chunk(
        id="wrn-002", page_number=183,
        chapter="Instrument Cluster & Warning Lights",
        section="Brake System Warning",
        content='A red brake icon with text "BRAKE" indicates the parking brake is engaged or brake fluid level is critically low. If the light persists after releasing the parking brake, safely stop the vehicle and do not drive further — have the car towed to a VinFast service centre.',
        car_model="VF8", category="warning"
    ),
    Chunk(
        id="wrn-003", page_number=184,
        chapter="Instrument Cluster & Warning Lights",
        section="Tire Pressure Monitoring System (TPMS)",
        content="The TPMS warning (amber exclamation mark inside parentheses) lights up when one or more tyres are significantly under-inflated. Check all tyre pressures with a gauge and inflate to the specification on the driver door jamb label (typically 38 PSI / 260 kPa front, 36 PSI / 250 kPa rear for VF8).",
        car_model="VF8", category="warning"
    ),
    Chunk(
        id="wrn-004", page_number=185,
        chapter="Instrument Cluster & Warning Lights",
        section="High-Voltage Battery Warning",
        content="A red battery icon with a lightning bolt indicates a high-voltage battery management system fault. This may limit power output or prevent charging initiation. Immediately contact VinFast roadside assistance and do not attempt to open the bonnet or access the high-voltage components.",
        car_model="VF8", category="warning"
    ),
    Chunk(
        id="wrn-005", page_number=186,
        chapter="Instrument Cluster & Warning Lights",
        section="Coolant Temperature Warning",
        content="A red thermometer icon signals coolant overtemperature. Pull over safely, switch off the climate control, and allow the vehicle to idle with the bonnet open to improve airflow. Do not open the coolant reservoir cap while the system is hot. If the warning persists after 5 minutes, shut down and call for assistance.",
        car_model="VF8", category="warning"
    ),
    Chunk(
        id="wrn-006", page_number=188,
        chapter="Instrument Cluster & Warning Lights",
        section="ABS Warning",
        content="An amber ABS text indicator means the anti-lock brake system has a fault. Normal hydraulic braking remains functional, but ABS features may be disabled. Drive cautiously on wet or slippery roads and have the system inspected by a VinFast technician.",
        car_model="VF9", category="warning"
    ),
    # ── OPERATIONS ─────────────────────────────────
    Chunk(
        id="op-001", page_number=32,
        chapter="Vehicle Operation",
        section="Start & Drive Procedure",
        content="With the smart key inside the cabin, press the brake pedal firmly and push the START/STOP button to power on the vehicle. The instrument cluster and infotainment screen will illuminate within 3 seconds. To shift into Drive, press the brake and rotate the rotary gear selector to D. A gentle chime confirms the vehicle is ready to drive.",
        car_model="VF8", category="operation"
    ),
    Chunk(
        id="op-002", page_number=34,
        chapter="Vehicle Operation",
        section="Powering Off & Parking",
        content="Come to a complete stop, engage the parking brake by pulling the PARK switch on the centre console, then press the START/STOP button to power off all systems. Ensure the gear selector is in P. The smart key must be carried outside the vehicle for it to lock; use the door handles or key fob lock button.",
        car_model="VF8", category="operation"
    ),
    Chunk(
        id="op-003", page_number=36,
        chapter="Vehicle Operation",
        section="Power Liftgate Operation",
        content="Press the liftgate release button on the key fob twice, or the soft-close button on the liftgate itself to open the power liftgate. The opening height is adjustable: with the liftgate open, hold the close button until a confirmation tone sounds at your preferred height. Hands-free opening is available by kicking your foot under the rear bumper (if equipped with the Hands-Free Package).",
        car_model="VF8", category="operation"
    ),
    Chunk(
        id="op-004", page_number=38,
        chapter="Vehicle Operation",
        section="Adjusting Exterior Mirrors",
        content="Use the mirror adjustment switch on the driver door panel: rotate the knob left or right to select the mirror, then move the 4-direction pad to tilt the glass. Press the folding button (chevron icon) to fold/unfold the mirrors. In infotainment Settings → Convenience, enable Auto-Fold on Lock to automatically fold mirrors whenever the vehicle is locked.",
        car_model="VF8", category="operation"
    ),
    Chunk(
        id="op-005", page_number=40,
        chapter="Vehicle Operation",
        section="Climate Control System",
        content="The dual-zone automatic climate system maintains driver and passenger set temperatures independently. Use the physical knobs or the climate panel in the centre display to adjust. Activate AUTO for one-touch automatic temperature regulation. Seat heaters and steering wheel heating buttons are located below the climate controls.",
        car_model="VF8", category="operation"
    ),
    Chunk(
        id="op-006", page_number=42,
        chapter="Vehicle Operation",
        section="Rotary Gear Selector",
        content="The VF8 uses a compact rotary gear selector on the centre console. Rotate clockwise for D (Drive) or R (Reverse); push the P button for Park. The selected gear is shown in the instrument cluster. The rotary mechanism is electronically actuated and requires the brake pedal to be pressed before shifting out of Park for safety.",
        car_model="VF8", category="operation"
    ),
    Chunk(
        id="op-007", page_number=44,
        chapter="Vehicle Operation",
        section="VF9 Three-Row Seat Configuration",
        content="The VF9 offers three rows of seating for up to 7 passengers. The second row seats slide forward on rails to grant third-row access; a fold-forward mechanism tips the seat cushion up for easier entry. All rear seats feature LATCH anchors for child restraints. The third-row seats fold flat to expand cargo volume from 283 L to 1,176 L.",
        car_model="VF9", category="operation"
    ),
    # ── SAFETY ─────────────────────────────────────
    Chunk(
        id="sft-001", page_number=200,
        chapter="Safety Systems",
        section="Airbag System Overview",
        content="The VF8 is equipped with up to 8 airbags including dual-stage front airbags, side curtain airbags covering all three rows, front side airbags, and a driver knee airbag. Airbags deploy based on collision severity and seat occupancy detection. Never install a rear-facing child seat in the front passenger seat; the passenger airbag will be disabled automatically when a child seat is detected.",
        car_model="VF8", category="safety"
    ),
    Chunk(
        id="sft-002", page_number=202,
        chapter="Safety Systems",
        section="Electronic Stability Control (ESC)",
        content="Electronic Stability Control detects loss of traction during cornering or evasive manoeuvres and selectively brakes individual wheels while reducing motor torque to help the driver maintain directional control. ESC cannot override the laws of physics; it is an assistance system. For off-road or track use, ESC can be partially disabled via the infotainment.",
        car_model="VF8", category="safety"
    ),
    Chunk(
        id="sft-003", page_number=204,
        chapter="Safety Systems",
        section="Seat Belt System",
        content="All three rows of seats are equipped with 3-point ELR seat belts with pretensioners and load limiters. In a sufficient frontal impact, pretensioners instantly remove slack from the belt, and the load limiter allows controlled belt give to reduce chest injury. Inspect belts regularly for fraying or damage.",
        car_model="VF8", category="safety"
    ),
    Chunk(
        id="sft-004", page_number=206,
        chapter="Safety Systems",
        section="Child Restraint System (LATCH)",
        content="The VF9 features LATCH (Lower Anchors and Tethers for Children) on the second-row outboard seats and top-tether anchors behind all three rear seat backs. The third-row seats support LATCH-compatible forward-facing child seats but not rear-facing due to limited legroom.",
        car_model="VF9", category="safety"
    ),
    # ── MAINTENANCE ────────────────────────────────
    Chunk(
        id="mnt-001", page_number=250,
        chapter="Maintenance Schedule",
        section="12-Month / 15,000 km Service",
        content="VinFast recommends a comprehensive service inspection every 12 months or 15,000 km, whichever comes first. The inspection covers: brake pad thickness, brake fluid condition, tyre condition and pressure, suspension components, high-voltage battery connectors, cooling system level, 12 V battery terminals, lighting systems, wiper blades, and fluid top-ups. Tyre rotation is included at every service.",
        car_model="VF8", category="maintenance"
    ),
    Chunk(
        id="mnt-002", page_number=252,
        chapter="Maintenance Schedule",
        section="Coolant Replacement",
        content="The high-voltage battery coolant and powertrain coolant each require replacement every 60,000 km or 4 years. Coolant must meet VinFast specification EV-COL-4; using incorrect coolant will void the battery warranty and may cause thermal runaway.",
        car_model="VF8", category="maintenance"
    ),
    Chunk(
        id="mnt-003", page_number=254,
        chapter="Maintenance Schedule",
        section="Tyre Care & Rotation",
        content="Rotate tyres every 10,000 km using a cross-rotation pattern (front-to-rear on same side) to promote even wear. Check tyre pressure monthly; cold-tyre pressures must match the door jamb sticker values. Replace tyres when tread depth falls below 1.6 mm or if sidewall damage is visible.",
        car_model="VF8", category="maintenance"
    ),
    Chunk(
        id="mnt-004", page_number=256,
        chapter="Maintenance Schedule",
        section="12-V Auxiliary Battery",
        content="The 12 V lead-acid auxiliary battery powers lights, infotainment, and control systems. It is charged by the DC-DC converter from the high-voltage pack whenever the vehicle is on or plugged in. In very cold climates (< -15°C), ensure the vehicle is plugged in when parked for extended periods. Replace every 3–4 years.",
        car_model="VF9", category="maintenance"
    ),
    # ── SPECIFICATIONS ─────────────────────────────
    Chunk(
        id="spc-001", page_number=300,
        chapter="Technical Specifications",
        section="VF8 Dimensions",
        content="The VinFast VF8 has overall dimensions of 4,750 mm length, 1,934 mm width (excluding mirrors), and 1,667 mm height. The wheelbase is 2,940 mm. Ground clearance is 150 mm with standard suspension. Kerb weight is approximately 2,295 kg for the base Edition and 2,380 kg for the Plus.",
        car_model="VF8", category="specification"
    ),
    Chunk(
        id="spc-002", page_number=302,
        chapter="Technical Specifications",
        section="VF8 Powertrain & Performance",
        content="The VF8 Dual Motor AWD produces a combined 300 kW (402 hp) and 640 Nm of torque, enabling 0–100 km/h in 5.5 seconds in Sport mode. Top speed is electronically limited to 200 km/h. Energy consumption is approximately 21.5 kWh/100 km (city) and 25.8 kWh/100 km (WLTP combined).",
        car_model="VF8", category="specification"
    ),
    Chunk(
        id="spc-003", page_number=304,
        chapter="Technical Specifications",
        section="VF9 Dimensions & Capacity",
        content="The VF9 measures 5,169 mm long, 1,983 mm wide, and 1,756 mm tall with a 3,150 mm wheelbase. It accommodates up to 7 adults across three rows and offers 283 L of cargo volume behind the third row, expanding to 1,176 L with all rear seats folded. Towing capacity is rated at 1,200 kg (braked) for the VF9 Eco variant.",
        car_model="VF9", category="specification"
    ),
    Chunk(
        id="spc-004", page_number=306,
        chapter="Technical Specifications",
        section="VF9 Powertrain & Performance",
        content="The VF9 uses dual permanent magnet synchronous motors delivering 300 kW (402 hp) and 620 Nm of torque to all four wheels. The 123 kWh battery pack provides an EPA range of up to 438 km; WLTP combined consumption is rated at 23.7 kWh/100 km. The VF9 supports V2L (Vehicle-to-Load) up to 3.3 kW via the CCS2 port adaptor.",
        car_model="VF9", category="specification"
    ),
]
