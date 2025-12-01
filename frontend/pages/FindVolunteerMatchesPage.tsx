import { useState, type ChangeEvent, type MouseEvent } from "react";
import type { Project } from "../../backend/models";

async function fetchMatchingProjects(
  volunteerName: string,
): Promise<Project[]> {
  const encoded_name = encodeURI(volunteerName);
  try {
    const response = await fetch(`/api/volunteers/${encoded_name}/matches`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  } catch (error) {
    console.error("Error creating Volunteer:", error);
    return [];
  }
}

function VolunteerSearchBox(props: {
  onSearchResults?: (projects: Project[]) => void;
}) {
  const [volunteerName, setVolunteerName] = useState("");
  const onChangeVolunteerName = (event: ChangeEvent<HTMLInputElement>) => {
    setVolunteerName(event.target.value);
  };
  const [isSearching, setIsSearching] = useState(false);
  const onClickSearch = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsSearching(true);
    const projects = await fetchMatchingProjects(volunteerName);
    console.log(`Found projects: ${projects}`);
    if (props.onSearchResults) {
      props.onSearchResults(projects);
    }
    setIsSearching(false);
  };
  return (
    <div>
      <form>
        <label htmlFor="voluneteer">Volunteer</label>
        <input
          type="text"
          id="volunteer"
          name="volunteer"
          value={volunteerName}
          onChange={onChangeVolunteerName}
        />
        <button type="submit" onClick={onClickSearch} disabled={isSearching}>
          Search
        </button>
      </form>
    </div>
  );
}

export default function FindVolunteerMatchesPage() {
  const [matchingProjects, setMatchingProjects] = useState<Project[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchResults = (projects: Project[]) => {
    setMatchingProjects(projects);
    setHasSearched(true);
  };

  const tableStyle: React.CSSProperties = {
    borderCollapse: "collapse",
    width: "100%",
    marginTop: "20px",
  };

  const thStyle: React.CSSProperties = {
    border: "1px solid black",
    borderBottom: "3px solid black",
    padding: "8px",
    fontWeight: "bold",
    textAlign: "left",
  };

  const tdStyle: React.CSSProperties = {
    border: "1px solid black",
    padding: "8px",
  };

  return (
    <div>
      <h2>Find Volunteer Matches</h2>
      <VolunteerSearchBox onSearchResults={handleSearchResults} />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Project Name</th>
            <th style={thStyle}>Organization Name</th>
            <th style={thStyle}>Required Days</th>
            <th style={thStyle}>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {matchingProjects.map((project, index) => (
            <tr
              key={project.name}
              style={{ backgroundColor: index % 2 === 0 ? "white" : "#f2f2f2" }}
            >
              <td style={tdStyle}>{project.name}</td>
              <td style={tdStyle}>{project.organizationName}</td>
              <td style={tdStyle}>{project.requiredDays}</td>
              <td style={tdStyle}>
                {new Date(project.dueDate).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {hasSearched && matchingProjects.length === 0 && (
            <tr>
              <td
                colSpan={4}
                style={{ ...tdStyle, textAlign: "center", fontStyle: "italic" }}
              >
                No matching projects found for this volunteer.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
