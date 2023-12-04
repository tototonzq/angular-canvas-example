import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Renderer2,
  OnInit,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnInit {
  public userAgent = new BehaviorSubject<string>('');
  public platform = new BehaviorSubject<string>('');
  public language = new BehaviorSubject<string>('');

  ngOnInit(): void {
    this.userAgent = new BehaviorSubject<string>(window.navigator.userAgent);
    this.platform = new BehaviorSubject<string>(window.navigator.platform);
    this.language = new BehaviorSubject<string>(window.navigator.language);
  }

  @ViewChild('drawingCanvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;
  private context!: CanvasRenderingContext2D;
  private isDrawing: boolean = false;
  private drawingHistory: any[] = [];
  private currentHistoryIndex: number = -1;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.context = this.canvas.nativeElement.getContext('2d')!;
    if (!this.context) {
      // Handle the error or return
      return;
    }
    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.context.lineWidth = 5;
    this.context.lineCap = 'round';
    this.context.strokeStyle = '#000';

    this.renderer.listen(this.canvas.nativeElement, 'touchstart', (e) =>
      this.startOrDraw(e)
    );
    this.renderer.listen(this.canvas.nativeElement, 'touchend', () =>
      this.stopDrawing()
    );
    this.renderer.listen(this.canvas.nativeElement, 'touchmove', (e) =>
      this.startOrDraw(e)
    );

    // Initial state for undo/redo
    this.saveState();
  }

  private startOrDraw(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0] as any;
    this.isDrawing = true;

    if (!this.isDrawing) return;

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    this.context.lineTo(x, y);
    this.context.stroke();
    this.context.beginPath();
    this.context.moveTo(x, y);
  }

  private stopDrawing(): void {
    this.isDrawing = false;
    this.context.beginPath();
    // Save the state after each drawing action
    this.saveState();
  }

  saveDrawing(): void {
    try {
      const image = this.canvas.nativeElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'drawing.png';
      link.click();
    } catch (error) {
      console.error('Error saving drawing:', error);
    }
  }

  clearCanvas(): void {
    this.context.clearRect(
      0,
      0,
      this.canvas.nativeElement.width,
      this.canvas.nativeElement.height
    );
    // Save the state after clearing the canvas
    this.saveState();
  }

  undo(): void {
    if (this.currentHistoryIndex > 0) {
      this.currentHistoryIndex--;
      this.restoreState();
    }
  }

  redo(): void {
    if (this.currentHistoryIndex < this.drawingHistory.length - 1) {
      this.currentHistoryIndex++;
      this.restoreState();
    }
  }

  private saveState(): void {
    const imageData = this.context.getImageData(
      0,
      0,
      this.canvas.nativeElement.width,
      this.canvas.nativeElement.height
    );
    this.drawingHistory = this.drawingHistory.slice(
      0,
      this.currentHistoryIndex + 1
    );
    this.drawingHistory.push(imageData);
    this.currentHistoryIndex = this.drawingHistory.length - 1;
  }

  private restoreState(): void {
    const imageData = this.drawingHistory[this.currentHistoryIndex];
    this.context.putImageData(imageData, 0, 0);
  }
}
