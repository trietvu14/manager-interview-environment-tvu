import { useState, type ChangeEvent, type MouseEvent } from "react";
import type { Project } from "../../backend/models";

async function fetchMatchingProjects(volunteerName: string): Promise<Project[]> {
  const encoded_name = encodeURI(volunteerName)
  try {
    const response = await fetch(`/api/volunteers/${encoded_name}/matches`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  } catch (error) {
    console.error('Error creating Volunteer:', error);
    return [];
  }
}

function VolunteerSearchBox(props: object) {
  const [volunteerName, setVolunteerName] = useState("");
  const onChangeVolunteerName = (event: ChangeEvent<HTMLInputElement>) => {
    setVolunteerName(event.target.value);
  }
  const [isSearching, setIsSearching] = useState(false);
  const onClickSearch = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsSearching(true);
    const projects = fetchMatchingProjects(volunteerName)
    console.log(`Found projects: ${projects}`);
    setIsSearching(false);
  }
  return (
    <div>
      <form>
        <label htmlFor="voluneteer">Volunteer</label>
        <input type="text" id="volunteer" name="volunteer" value={volunteerName} onChange={onChangeVolunteerName}/>
        <button type="submit" onClick={onClickSearch} disabled={isSearching}>Search</button>
      </form>
    </div>
  );
}


export default function FindVolunteerMatchesPage() {
  // TODO: Complete this React component, making it dynamically update with search results once the "Search" button is clicked.
  //       Give the table some basic styling:
  //           - Add borders to the table and cells
  //           - Make the header row bold and a thicker underline.
  //           - Alternate the background color of the rows for better readability
  return (
    <div>
      <h2>Find Volunteer Matches</h2>
      <VolunteerSearchBox />
      <table>
        <thead>
        <tr>
          <th>Project Name</th>
          <th>Organization Name</th>
          <th>Required Days</th>
          <th>Due Date</th>
        </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    </div>
  );
}
