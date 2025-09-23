import React, { useState, useContext } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  ListGroup,
  Row,
  Col,
  Alert,
  Spinner,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { TimetableContext } from "../context/TimetableContext";
import Timetable from "../components/common/Timetable";
import axios from "axios";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  // We still call setTimetable to update the global context for other pages
  const { setTimetable, TIMESLOTS } = useContext(TimetableContext);

  // --- FIX 1: Add local state for displaying the generated timetable ---
  const [generatedTimetable, setGeneratedTimetable] = useState(null);

  // --- Overall Page State ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [teacherName] = useState("Dr. Gamma");

  // --- STATE FOR ALL TIMETABLE ENTITIES ---
  const [batches, setBatches] = useState(["Batch_A", "Batch_B"]);
  const [newBatch, setNewBatch] = useState("");

  const [rooms, setRooms] = useState([{ name: "R101", type: "Lecture" }, { name: "L201", type: "Lab" }]);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState("Lecture");

  const [subjects, setSubjects] = useState([{ name: "CS_Theory", is_lab: false }, { name: "Physics_Lab", is_lab: true }]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectIsLab, setNewSubjectIsLab] = useState(false);

  // --- FIX 2: Update teacher state to include individual availability ---
  const [teachers, setTeachers] = useState([
    { name: "Mr. Alpha", subjects: "Math, Physics", availability: "9-10, 10-11, 11-12" },
    { name: "Dr. Gamma", subjects: "CS_Theory, Physics_Lab", availability: "10-11, 2-3, 3-4" }
  ]);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherSubjects, setNewTeacherSubjects] = useState("");
  const [newTeacherAvailability, setNewTeacherAvailability] = useState(""); // New state for the input

  const [courseLoad, setCourseLoad] = useState([{ batch: "Batch_A", subject: "CS_Theory", hours: 30 }]);
  const [newLoadBatch, setNewLoadBatch] = useState("");
  const [newLoadSubject, setNewLoadSubject] = useState("");
  const [newLoadHours, setNewLoadHours] = useState(15);
  
  const [availability, setAvailability] = useState(() => {
    const map = {};
    (TIMESLOTS || []).forEach((t) => (map[t] = false));
    return map;
  });

  const addToList = (item, setter, list) => { if (item && !list.includes(item)) setter([...list, item]); };
  const removeFromList = (index, setter, list) => { setter(list.filter((_, i) => i !== index)); };

  const handleGenerateTimetable = async () => {
    setError("");
    setIsLoading(true);
    setGeneratedTimetable(null); // Clear previous results

    // --- FIX 2: Correctly assemble teacher availability ---
    const teacherAvailabilities = Object.fromEntries(
      teachers.map(t => [t.name, t.availability.split(',').map(slot => slot.trim())])
    );
    // Important: Override the logged-in teacher's availability with what's selected in the checkboxes
    teacherAvailabilities[teacherName] = TIMESLOTS.filter(slot => availability[slot]);

    const finalConfig = {
      DAYS: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      TIMESLOTS: TIMESLOTS || [],
      SEMESTER_WEEKS: 15,
      BATCHES: batches,
      ROOMS: Object.fromEntries(rooms.map(r => [r.name, { type: r.type }])),
      SUBJECTS: Object.fromEntries(subjects.map(s => [s.name, { is_lab: s.is_lab }])),
      TEACHERS: Object.fromEntries(teachers.map(t => [t.name, t.subjects.split(',').map(sub => sub.trim())])),
      TEACHER_AVAILABILITY: teacherAvailabilities, // Use the correctly assembled availability
      CONTRACTED_HOURS: courseLoad.reduce((acc, load) => {
        if (!acc[load.batch]) acc[load.batch] = {};
        acc[load.batch][load.subject] = Number(load.hours);
        return acc;
      }, {}),
      COURSE_LOAD: courseLoad.reduce((acc, load) => {
          if (!acc[load.batch]) acc[load.batch] = {};
          const weeklyHours = Math.round(Number(load.hours) / 15); 
          acc[load.batch][load.subject] = weeklyHours > 0 ? weeklyHours : 1;
          return acc;
      }, {}),
    };

    try {
      const token = localStorage.getItem("firebaseIdToken");
      if (!token) throw new Error("Authentication error. Please log in again.");

      const response = await axios.post('http://127.0.0.1:5000/api/generate', finalConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const transformed = transformBackendResponse(response.data, finalConfig.TIMESLOTS);
      // --- FIX 1: Update both local and context state ---
      setGeneratedTimetable(transformed); // This makes it display on this page reliably
      setTimetable(transformed);          // This updates the global state for other pages
      setNotifications([`✅ Timetable generated successfully!`]);

    } catch (err) {
      const msg = err.response?.data?.error || err.message || "An unexpected error occurred.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const transformBackendResponse = (backendData, timeslots) => {
  // 1. Initial check: Ensure the data is valid
  if (!backendData || !backendData.batches || !timeslots || timeslots.length === 0) {
    console.error("Invalid data received from backend:", backendData);
    return {}; // Return an empty timetable if data is malformed
  }

  // 2. Create the empty timetable grid that our frontend component expects
  const newTimetable = {};
  const shortDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  shortDays.forEach(day => {
    newTimetable[day] = Array(timeslots.length).fill("");
  });

  const batchesData = backendData.batches;

  // 3. Loop through each batch provided by the backend (e.g., "Batch_A", "Batch_B")
  for (const batchName in batchesData) {
    const batchTimetable = batchesData[batchName];

    // 4. Loop through each day in that batch's schedule ("Monday", "Tuesday", etc.)
    for (const dayName in batchTimetable) {
      const daySlots = batchTimetable[dayName];
      const dayKey = dayName.slice(0, 3); // Convert "Monday" to "Mon"

      // 5. Check if the day is valid
      if (shortDays.includes(dayKey)) {
        // 6. Loop through each class scheduled on that day
        for (const timeslotStr in daySlots) {
          const classDetails = daySlots[timeslotStr];
          
          // 7. Find the correct numerical position (index) of the timeslot
          const timeIndex = timeslots.indexOf(timeslotStr);

          // 8. If the timeslot exists, format the text and place it in the grid
          if (timeIndex !== -1) {
            const displayString = `${classDetails.subject} (${batchName}) in ${classDetails.room}`;
            // If a slot is already filled, this will append the new class.
            // Useful for seeing conflicts or multiple groups.
            if (newTimetable[dayKey][timeIndex]) {
              newTimetable[dayKey][timeIndex] += ` | ${displayString}`;
            } else {
              newTimetable[dayKey][timeIndex] = displayString;
            }
          }
        }
      }
    }
  }

  // 9. Return the fully populated grid
  return newTimetable;
};

  return (
    <Container className="my-5">
      <h2 className="mb-4 text-center">Welcome, {teacherName} (Admin Dashboard)</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* ... (Batches, Rooms, Subjects Cards are unchanged) ... */}
       <Row>
        {/* Batches & Rooms */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header><h5>🎓 Batches</h5></Card.Header>
            <Card.Body>
              <ListGroup>
                {batches.map((b, i) => <ListGroup.Item key={i}>{b} <Button variant="outline-danger" size="sm" className="float-end" onClick={() => removeFromList(i, setBatches, batches)}>X</Button></ListGroup.Item>)}
              </ListGroup>
              <InputGroup className="mt-3">
                <FormControl placeholder="New Batch Name" value={newBatch} onChange={e => setNewBatch(e.target.value)} />
                <Button onClick={() => { addToList(newBatch, setBatches, batches); setNewBatch(""); }}>Add Batch</Button>
              </InputGroup>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header><h5>🏛️ Rooms</h5></Card.Header>
            <Card.Body>
               <ListGroup>
                {rooms.map((r, i) => <ListGroup.Item key={i}>{r.name} ({r.type})<Button variant="outline-danger" size="sm" className="float-end" onClick={() => removeFromList(i, setRooms, rooms)}>X</Button></ListGroup.Item>)}
              </ListGroup>
              <InputGroup className="mt-3">
                 <FormControl placeholder="Room Name (e.g., R101)" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
                 <Form.Select value={newRoomType} onChange={e => setNewRoomType(e.target.value)}>
                   <option>Lecture</option>
                   <option>Lab</option>
                 </Form.Select>
                 <Button onClick={() => { setRooms([...rooms, {name: newRoomName, type: newRoomType}]); setNewRoomName(""); }}>Add Room</Button>
              </InputGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Card className="mb-4">
        <Card.Header><h5>📚 Subjects</h5></Card.Header>
        <Card.Body>
          <Row>
            {subjects.map((s, i) => (
              <Col md={4} key={i} className="mb-2"><ListGroup.Item>{s.name} {s.is_lab && "(Lab)"} <Button variant="outline-danger" size="sm" className="float-end" onClick={() => removeFromList(i, setSubjects, subjects)}>X</Button></ListGroup.Item></Col>
            ))}
          </Row>
          <InputGroup className="mt-3">
            <FormControl placeholder="New Subject Name" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} />
            <InputGroup.Text>Is it a Lab?</InputGroup.Text>
            <InputGroup.Checkbox checked={newSubjectIsLab} onChange={e => setNewSubjectIsLab(e.target.checked)} />
            <Button onClick={() => { setSubjects([...subjects, { name: newSubjectName, is_lab: newSubjectIsLab }]); setNewSubjectName(""); }}>Add Subject</Button>
          </InputGroup>
        </Card.Body>
      </Card>
      {/* FIX 2: Modified Teachers card to include availability input */}
      <Card className="mb-4">
        <Card.Header><h5>🧑‍🏫 Teachers & Their Availability</h5></Card.Header>
        <Card.Body>
          <ListGroup>
            {teachers.map((t, i) => (
              <ListGroup.Item key={i}>
                <strong>{t.name}</strong> <br />
                <small><em>Subjects:</em> {t.subjects}</small> <br/>
                <small><em>Availability:</em> {t.availability}</small>
                <Button variant="outline-danger" size="sm" className="float-end" onClick={() => removeFromList(i, setTeachers, teachers)}>X</Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
          <InputGroup className="mt-3">
            <FormControl placeholder="Teacher Name" value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} />
            <FormControl placeholder="Subjects (comma-separated)" value={newTeacherSubjects} onChange={e => setNewTeacherSubjects(e.target.value)} />
            <FormControl placeholder="Availability (e.g., 9-10, 2-3)" value={newTeacherAvailability} onChange={e => setNewTeacherAvailability(e.target.value)} />
            <Button onClick={() => {
              setTeachers([...teachers, { name: newTeacherName, subjects: newTeacherSubjects, availability: newTeacherAvailability }]);
              setNewTeacherName(""); setNewTeacherSubjects(""); setNewTeacherAvailability("");
            }}>Add Teacher</Button>
          </InputGroup>
        </Card.Body>
      </Card>
      
      {/* ... (Course Load card is unchanged) ... */}
      <Card className="mb-4">
            <Card.Header><h5>⏱️ Course Load (Total Hours per Batch/Subject)</h5></Card.Header>
            <Card.Body>
              <ListGroup>
                  {courseLoad.map((l, i) => <ListGroup.Item key={i}>{l.batch} / {l.subject}: {l.hours} hrs <Button variant="outline-danger" size="sm" className="float-end" onClick={() => removeFromList(i, setCourseLoad, courseLoad)}>X</Button></ListGroup.Item>)}
              </ListGroup>
               <InputGroup className="mt-3">
                 <Form.Select value={newLoadBatch} onChange={e => setNewLoadBatch(e.target.value)}>
                    <option>Select Batch...</option>
                    {batches.map(b => <option key={b} value={b}>{b}</option>)}
                 </Form.Select>
                 <Form.Select value={newLoadSubject} onChange={e => setNewLoadSubject(e.target.value)}>
                    <option>Select Subject...</option>
                    {subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                 </Form.Select>
                 <FormControl type="number" placeholder="Total Hours" value={newLoadHours} onChange={e => setNewLoadHours(e.target.value)} />
                 <Button onClick={() => { setCourseLoad([...courseLoad, {batch: newLoadBatch, subject: newLoadSubject, hours: newLoadHours}]); }}>Add Load</Button>
              </InputGroup>
            </Card.Body>
          </Card>
      <Card className="mb-4">
        <Card.Header><h5>📌 Your Specific Availability </h5></Card.Header>
        <Card.Body><Row>{(TIMESLOTS || []).map(slot => (<Col xs={6} md={3} key={slot}><Form.Check type="checkbox" label={slot} onChange={() => setAvailability(prev => ({ ...prev, [slot]: !prev[slot] }))} /></Col>))}</Row></Card.Body>
      </Card>

      <div className="text-center mb-4"><Button size="lg" variant="success" onClick={handleGenerateTimetable} disabled={isLoading}>{isLoading ? <><Spinner size="sm" /> Generating...</> : "🚀 Generate Master Timetable with AI"}</Button></div>

      {/* FIX 1: Display the timetable using the local state variable */}
      {generatedTimetable && <Card className="mb-4"><Card.Header><h5>Generated Timetable</h5></Card.Header><Card.Body><Timetable customTimetable={generatedTimetable} /></Card.Body></Card>}
      
      <Card className="mb-4"><Card.Header><h5>🔔 Notifications</h5></Card.Header><ListGroup variant="flush"><ListGroup.Item>{notifications[0] || "No notifications yet"}</ListGroup.Item></ListGroup></Card>
    </Container>
  );
};

export default TeacherDashboard;