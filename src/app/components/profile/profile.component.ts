import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/utilisateur.service'; // adjust path if needed

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  errorMsg = '';

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.userService.getUserById(userId).subscribe({
        next: (data) => this.user = data,
        error: (err) => this.errorMsg = 'Error loading user profile'
      });
    }
  }
}
