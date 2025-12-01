// A simplistic sqlite-based database implementation for Tech Assist Portal
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";
import { Project, Volunteer } from "./models";

interface VolunteerRow {
    name_as_key: string;
    name: string;
    skills: string; // JSON stringified
    availability: string; // JSON stringified
}

interface ProjectRow {
    name_as_key: string;
    name: string;
    organizationName: string;
    requiredDays: number;
    dueDate: string; // ISO string
    skillsNeeded: string; // JSON stringified
}

function normalizeName(name: string): string {
    return name.trim().toLowerCase();
}

function initializeDatabaseSchema(
    db: Database<sqlite3.Database, sqlite3.Statement>,
) {
    console.log("Initializing database schema...");
    return Promise.all([
        db.exec(`
            CREATE TABLE IF NOT EXISTS volunteers (
                name_as_key TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                skills TEXT NOT NULL,
                availability TEXT NOT NULL
            )
        `),
        db.exec(`
            CREATE TABLE IF NOT EXISTS projects (
                name_as_key TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                organizationName TEXT NOT NULL,
                requiredDays INTEGER NOT NULL,
                dueDate TEXT NOT NULL,
                skillsNeeded TEXT NOT NULL
            )
        `),
    ]);
}

export interface TechAssistPortalDatabase {
    /**
     * Save a record with volunteer information
     * name will be normalized into name_as_key for primary key
     * @param volunteer
     */
    putVolunteer(volunteer: Volunteer): Promise<void>;
    /**
     * Get just one volunteer record, name will be normalized for lookup
     * @param name
     */
    getVolunteer(name: string): Promise<Volunteer | undefined>;
    /**
     * Get just one volunteer record, name will be normalized for lookup
     * @param name
     */
    getVolunteers(): Promise<Volunteer[]>;
    /**
     * Save a record with project information
     * name will be normalized into name_as_key for primary key
     * @param project
     */
    putProject(project: Project): Promise<void>;
    /**
     * Get all project records
     */
    getProjects(): Promise<Project[]>;
    /**
     * Get Matching Projects
     * @param volunteerName: The name of volunteer to find matches for
     */
    getMatchingProjects(volunteerName: string): Promise<Project[]>;
}

export async function initializeDatabase(
    filename: string,
): Promise<TechAssistPortalDatabase> {
    // open the database
    const db = await open({
        filename,
        driver: sqlite3.Database,
    });

    await initializeDatabaseSchema(db);

    const selectVolunteersStmt = await db.prepare("SELECT * FROM volunteers");
    const selectProjectsStmt = await db.prepare("SELECT * FROM projects");
    const insertVolunteerStmt = await db.prepare(`
        INSERT OR REPLACE INTO volunteers (name_as_key, name, skills, availability)
        VALUES (?, ?, ?, ?)
    `);
    const insertProjectStmt = await db.prepare(`
        INSERT OR REPLACE INTO projects (name_as_key, name, organizationName, requiredDays, dueDate, skillsNeeded)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    async function putVolunteer(volunteer: Volunteer): Promise<void> {
        const { name, skills, availability } = volunteer;
        await insertVolunteerStmt.run(
            normalizeName(name),
            name,
            JSON.stringify(skills),
            JSON.stringify(availability),
        );
    }

    async function getVolunteer(name: string): Promise<Volunteer | undefined> {
        const row = await db.get(
            "SELECT * FROM volunteers WHERE name_as_key = ?",
            normalizeName(name),
        );
        if (!row) return undefined;
        return {
            name: row.name,
            skills: JSON.parse(row.skills),
            availability: JSON.parse(row.availability),
        };
    }

    async function getVolunteers(): Promise<Volunteer[]> {
        const rows: VolunteerRow[] = await selectVolunteersStmt.all();
        return rows.map((row: VolunteerRow) => ({
            name: row.name,
            skills: JSON.parse(row.skills),
            availability: JSON.parse(row.availability),
        }));
    }

    async function putProject(project: Project): Promise<void> {
        const { name, organizationName, requiredDays, dueDate, skillsNeeded } =
            project;
        await insertProjectStmt.run(
            normalizeName(name),
            name,
            organizationName,
            requiredDays,
            dueDate.toISOString(),
            JSON.stringify(skillsNeeded),
        );
    }

    async function getProjects(): Promise<Project[]> {
        const projectsRows: ProjectRow[] = await selectProjectsStmt.all();
        const projects = projectsRows.map((row: ProjectRow) => ({
            name: row.name,
            organizationName: row.organizationName,
            requiredDays: row.requiredDays,
            dueDate: new Date(row.dueDate),
            skillsNeeded: JSON.parse(row.skillsNeeded),
        }));
        console.log("Loaded projects:", projects);
        return projects;
    }

    async function getMatchingProjects(
        volunteerName: string,
    ): Promise<Project[]> {
        const volunteer = await getVolunteer(volunteerName);
        if (!volunteer) {
            return [];
        }

        const allProjects = await getProjects();

        const matchingProjects = allProjects.filter((project) => {
            const hasMatchingSkill = project.skillsNeeded.every((skill) =>
                volunteer.skills.some(
                    (volunteerSkill) => volunteerSkill === skill,
                ),
            );

            if (!hasMatchingSkill) {
                return false;
            }

            const availableDatesBeforeDue = volunteer.availability.filter(
                (availDate) => {
                    const availDateTime = new Date(availDate).getTime();
                    const dueDateTime = new Date(project.dueDate).getTime();
                    return availDateTime <= dueDateTime;
                },
            );

            return availableDatesBeforeDue.length >= project.requiredDays;
        });

        return matchingProjects;
    }

    return {
        putVolunteer,
        getVolunteer,
        getVolunteers,
        putProject,
        getProjects,
        getMatchingProjects,
    };
}
