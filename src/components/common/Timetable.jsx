// src/components/common/Timetable.jsx
import React from "react";
import { Button } from "react-bootstrap";

const Timetable = ({ customTimetable, title = "timetable" }) => {

  const exportToCSV = () => {
    if (!customTimetable) return;

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const times = Object.keys(customTimetable.Mon || {}); // assumes Mon has all rows

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += ["Time", ...days].join(",") + "\r\n";

    times.forEach((idx) => {
      const row = [idx];
      days.forEach((day) => {
        row.push(customTimetable[day][idx] || "");
      });
      csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="table-wrapper">
      <Button variant="success" className="mb-2" onClick={exportToCSV}>
        Export Timetable
      </Button>
      <table className="table table-bordered text-center">
        <thead>
          <tr>
            <th>Time</th>
            <th>Mon</th>
            <th>Tue</th>
            <th>Wed</th>
            <th>Thu</th>
            <th>Fri</th>
          </tr>
        </thead>
        <tbody>
          {customTimetable &&
            Object.keys(customTimetable.Mon).map((time, idx) => (
              <tr key={idx}>
                <th>{time}</th>
                <td>{customTimetable.Mon[time]}</td>
                <td>{customTimetable.Tue[time]}</td>
                <td>{customTimetable.Wed[time]}</td>
                <td>{customTimetable.Thu[time]}</td>
                <td>{customTimetable.Fri[time]}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default Timetable;
