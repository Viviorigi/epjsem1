import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

export interface TeamMember {
  id: number;
  name: string;
  title: string;
  image: string;
  quote: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamMembersService {
  private dataUrl = 'assets/data/carrio-motors-data.json';
  private teamMemberData: Observable<any> | null = null;

  constructor(private http: HttpClient) { }

  private getData(): Observable<any> {
    if (!this.teamMemberData) {
      this.teamMemberData = this.http.get<any>(this.dataUrl).pipe(
        catchError(error => {
          console.error('Error fetching TeamMember data', error);
          return throwError('Failed to load TeamMember data. Please try again later.');
        }),
        shareReplay(1)
      );
    }
    return this.teamMemberData;
  }

  // Get all TeamMembers
  getAllTeamMembers(): Observable<TeamMember[]> {
    return this.getData().pipe(
      map(data => data.TeamMembers)
    );
  }

  // Get TeamMember by ID
  getTeamMemberById(TeamMemberId: number): Observable<TeamMember> {
    return this.getData().pipe(
      map(data => {
        const TeamMember = data.TeamMembers.find((t: TeamMember) => t.id === TeamMemberId);
        if (!TeamMember) {
          throw new Error(`TeamMember with ID ${TeamMemberId} not found`);
        }
        return TeamMember;
      }),
      catchError(error => {
        console.error('Error getting TeamMember by ID', error);
        return throwError(error);
      })
    );
  }

  // Get random TeamMembers
  getRandomTeamMembers(count: number = 2): Observable<TeamMember[]> {
    return this.getData().pipe(
      map(data => {
        const TeamMembers = [...data.TeamMembers];
        const result: TeamMember[] = [];
        
        // Ensure we don't request more TeamMembers than exist
        const requestCount = Math.min(count, TeamMembers.length);
        
        // Simple random selection
        for (let i = 0; i < requestCount; i++) {
          const randomIndex = Math.floor(Math.random() * TeamMembers.length);
          result.push(TeamMembers[randomIndex]);
          // Remove selected TeamMember to avoid duplicates
          TeamMembers.splice(randomIndex, 1);
        }
        
        return result;
      })
    );
  }
  
  // Get featured TeamMember (for display on homepage)
  getFeaturedTeamMember(): Observable<TeamMember> {
    return this.getData().pipe(
      map(data => {
        // Could implement more sophisticated logic here to pick a truly featured one
        // For now, just return the first one
        return data.TeamMembers[0];
      })
    );
  }
}