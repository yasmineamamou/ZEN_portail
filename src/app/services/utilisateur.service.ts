import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, forkJoin } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
@Injectable({
    providedIn: 'root' // ✅ Ensures service is globally available
})
export class UserService {
    private apiUrl = 'http://localhost:3000/api/users';
    private Url = 'http://localhost:3000';
    private api = 'http://localhost:3000/api';
    private userCubeApiUrl = 'http://localhost:3000/api/user_cube'; // Junction table API
    private cubeApiUrl = 'http://localhost:3000/cubes'; // Cube names API

    private userUniteApiUrl = 'http://localhost:3000/api/user_unite'; // Junction table API
    private uniteApiUrl = 'http://localhost:3000/unites'; // Cube names API

    constructor(private http: HttpClient) { }

    createUser(userData: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, userData);
    }
    // ✅ Get all users
    getUsers(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }
    getUser(userId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${userId}`);
    }

    // ✅ Add a new user
    addUser(user: any): Observable<any> {
        const formData = new FormData();
        Object.keys(user).forEach(key => {
            formData.append(key, user[key]);
        });
        return this.http.post(this.apiUrl, formData);
    }

    // ✅ Update a user
    updateUser(id: number, user: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, user);
    }

    updateUserUnite(userId: number, uniteId: number): Observable<any> {
        return this.http.put(`${this.api}/user_unite`, { user_id: userId, unite_id: uniteId });
    }


    updateUserCube(userId: number, cubeId: number): Observable<any> {
        return this.http.put(`${this.api}/user_cube`, { user_id: userId, cube_id: cubeId });
    }


    getUserById(userId: number): Observable<any> {
        return this.http.get<any>(`${this.api}/users/${userId}`).pipe(
            tap(user => {
                if (!user || !user.id) {
                    console.error("API returned user data without an ID:", user);
                }
            })
        );
    }


    // Convert base64 image to Blob
    dataURItoBlob(dataURI: string): Blob {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        }

        return new Blob([arrayBuffer], { type: mimeString });
    }


    // ✅ Delete a user
    deleteUsers(userIds: number[]): Observable<any> {
        const idsParam = userIds.join(','); // Convert array to comma-separated string
        return this.http.delete(`${this.apiUrl}/${idsParam}`);
    }


    getSocietes() {
        return this.http.get<any[]>(`${this.api}/societes`);
    }

    getDepartements(societeId: number) {
        return this.http.get<any[]>(`${this.api}/departements/${societeId}`); // ✅ Correct path
    }


    getPostes() {
        return this.http.get<any[]>(`${this.Url}/postes`);
    }

    getUnites() {
        return this.http.get<any[]>(`${this.Url}/unites`);
    }

    getCubes() {
        return this.http.get<any[]>(`${this.Url}/cubes`);
    }
    getAllDepartements() {
        return this.http.get<any[]>(`${this.api}/departements`); // Fetch all départements
    }
    getUserUnites(userId: number): Observable<number[]> {
        return this.http.get<number[]>(`${this.apiUrl}/users/${userId}/unites`);
    }

    getUserCubes(userId: number): Observable<number[]> {
        return this.http.get<number[]>(`${this.api}/users/${userId}/cubes`);
    }
    addUserUnite(userId: number, uniteId: number): Observable<any> {
        return this.http.post<any>(`${this.api}/user_unite`, { user_id: userId, unite_id: uniteId });
    }

    // Step 3: Link User to Cube
    addUserCube(userId: number, cubeId: number): Observable<any> {
        return this.http.post<any>(`${this.api}/user_cube`, { user_id: userId, cube_id: cubeId });
    }
    createUserUnite(userData: any): Observable<any> {
        return this.http.post('http://localhost:3000/api/user_unite', userData);
    }

    createUserCube(userData: any): Observable<any> {
        return this.http.post('http://localhost:3000/api/user_cube', userData);
    }
    getCubesByUserId(userId: number): Observable<string[]> {
        return this.http.get<string[]>(`${this.apiUrl}/user/${userId}`);
    }
    getCubesForUser(userId: number): Observable<string[]> {
        return this.http.get<{ user_id: number; cube_id: number }[]>(this.userCubeApiUrl).pipe(
            map((userCubeData: { user_id: number; cube_id: number }[]) => {
                // Extract cube IDs related to the given user
                const cubeIds: number[] = userCubeData
                    .filter(entry => entry.user_id === userId)
                    .map(entry => entry.cube_id);

                return cubeIds;
            }),
            switchMap((cubeIds: number[]) => {
                if (cubeIds.length === 0) {
                    return new Observable<string[]>(observer => {
                        observer.next(["Aucun"]);
                        observer.complete();
                    });
                }

                // Fetch cube names for these IDs
                const cubeRequests: Observable<{ nom: string }>[] = cubeIds.map(id =>
                    this.http.get<{ nom: string }>(`${this.cubeApiUrl}/${id}`)
                );

                return forkJoin(cubeRequests).pipe(
                    map((cubes: { nom: string }[]) => cubes.map(cube => cube.nom))
                );
            })
        );
    }
    getUnitesForUser(userId: number): Observable<string[]> {
        return this.http.get<{ user_id: number; unite_id: number }[]>(this.userUniteApiUrl).pipe(
            map((userUniteData: { user_id: number; unite_id: number }[]) => {
                // Extract unite IDs related to the given user
                const uniteIds: number[] = userUniteData
                    .filter(entry => entry.user_id === userId)
                    .map(entry => entry.unite_id);

                return uniteIds;
            }),
            switchMap((uniteIds: number[]) => {
                if (uniteIds.length === 0) {
                    return new Observable<string[]>(observer => {
                        observer.next(["Aucun"]);
                        observer.complete();
                    });
                }

                // Fetch unite names for these IDs
                const uniteRequests: Observable<{ nom: string }>[] = uniteIds.map(id =>
                    this.http.get<{ nom: string }>(`${this.uniteApiUrl}/${id}`)
                );

                return forkJoin(uniteRequests).pipe(
                    map((unites: { nom: string }[]) => unites.map(unite => unite.nom))
                );
            })
        );
    }

}
