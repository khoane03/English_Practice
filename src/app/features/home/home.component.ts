import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly data = inject(DataService);
  readonly questionCount = computed(() => this.data.questions().length);
  readonly imageCount = computed(() => this.data.imageExercises().length);
}
