import {NgModule,Component,OnInit,Input,Output,EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DomSanitizationService} from '@angular/platform-browser';
import {ButtonModule} from '../button/button';
import {MessagesModule} from '../messages/messages';
import {ProgressBarModule} from '../progressbar/progressbar';
import {Message} from '../common/api';

@Component({
    selector: 'p-fileUpload',
    template: `
        <div [ngClass]="'ui-fileupload ui-widget'" [ngStyle]="style" [class]="styleClass">
            <div class="ui-fileupload-buttonbar ui-widget-header ui-corner-top">
                <button type="button" label="Choose" icon="fa-plus" pButton class="ui-fileupload-choose" (click)="fileinput.value=null" [disabled]="disabled"> 
                    <input #fileinput type="file" (change)="onFileSelect($event)" [multiple]="multiple" [accept]="accept" [disabled]="disabled">
                </button>

                <button type="button" label="Upload" icon="fa-upload" pButton (click)="upload()" [disabled]="!hasFiles()"></button>
                <button type="button" label="Cancel" icon="fa-close" pButton (click)="clear()" [disabled]="!hasFiles()"></button>
            </div>
            <div [ngClass]="{'ui-fileupload-content ui-widget-content ui-corner-bottom':true,'ui-fileupload-highlight':dragHighlight}" 
                (dragenter)="onDragEnter($event)" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
                <p-progressBar [value]="progress" [showValue]="false" *ngIf="hasFiles()"></p-progressBar>
                
                <p-messages [value]="msgs"></p-messages>
                
                <div class="ui-fileupload-files" *ngIf="hasFiles()">
                    <div class="ui-fileupload-row" *ngFor="let file of files;let i = index;">
                        <div><img [src]="file.objectURL" *ngIf="isImage(file)" width="50" /></div>
                        <div>{{file.name}}</div>
                        <div>{{formatSize(file.size)}}</div>
                        <div><button type="button" icon="fa-close" pButton (click)="remove(i)"></button></div>
                    </div>
                </div>
                
                <ng-content></ng-content>
            </div>
        </div>
    `
})
export class FileUpload implements OnInit {
    
    @Input() name: string;
    
    @Input() url: string;
    
    @Input() multiple: boolean;
    
    @Input() accept: string;
    
    @Input() disabled: boolean;
        
    @Input() maxFileSize: number;
    
    @Input() invalidFileSizeMessageSummary: string = '{0}: Invalid file size, ';
    
    @Input() invalidFileSizeMessageDetail: string = 'maximum upload size is {0}.';
    
    @Input() style: string;
    
    @Input() styleClass: string;
    
    @Output() onBeforeUpload: EventEmitter<any> = new EventEmitter();
        
    @Output() onUpload: EventEmitter<any> = new EventEmitter();
    
    @Output() onError: EventEmitter<any> = new EventEmitter();
    
    @Output() onClear: EventEmitter<any> = new EventEmitter();
    
    @Output() onSelect: EventEmitter<any> = new EventEmitter();
     
    files: File[];
    
    progress: number = 0;
    
    dragHighlight: boolean;
    
    msgs: Message[];
    
    constructor(private sanitizer:DomSanitizationService){}
    
    ngOnInit() {
        this.files = [];
    }
    
    onFileSelect(event) {
        this.msgs = [];
        let files = event.dataTransfer ? event.dataTransfer.files : event.target.files;
        for(let i = 0; i < files.length; i++) {
            let file = files[i];
            if(this.validate(file)) {
                if(this.isImage(file)) {
                    file.objectURL = this.sanitizer.bypassSecurityTrustUrl((window.URL.createObjectURL(files[i])));
                }
                
                this.files.push(files[i]);
            }
        }
        
        this.onSelect.emit({originalEvent: event, files: files});
    }
    
    validate(file: File): boolean {
        if(this.maxFileSize  && file.size > this.maxFileSize) {
            this.msgs.push({
                severity: 'error', 
                summary: this.invalidFileSizeMessageSummary.replace('{0}', file.name), 
                detail: this.invalidFileSizeMessageDetail.replace('{0}', this.formatSize(this.maxFileSize))
            });
            return false;
        }
        
        return true;
    }
    
    isImage(file: File): boolean {
        return /^image\//.test(file.type);
    }
    
    onImageLoad(img: any) {
        window.URL.revokeObjectURL(img.src);
    }
    
    upload() {
        this.msgs = [];
        let xhr = new XMLHttpRequest(),
        formData = new FormData();
        
        for(let i = 0; i < this.files.length; i++) {
            formData.append(this.name, this.files[i], this.files[i].name);
        }
        
        xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
            if(e.lengthComputable) {
              this.progress = Math.round((e.loaded * 100) / e.total);
            }
          }, false);

        xhr.onreadystatechange = () => {
            if(xhr.readyState == 4) {
                this.progress = 0;
                
                if(xhr.status == 200)
                    this.onUpload.emit({xhr: xhr});
                else
                    this.onError.emit({xhr: xhr});
                
                this.clear();
            }
        };
        
        this.onBeforeUpload.emit({
            'xhr': xhr,
            'formData': formData 
        });
        
        xhr.open('POST', this.url, true);
        xhr.send(formData);
    }

    clear() {
        this.files = [];
        this.onClear.emit();
    }
    
    remove(index: number) {
        this.files.splice(index, 1);
    }
    
    hasFiles(): boolean {
        return this.files && this.files.length > 0;
    }
    
    onDragEnter(e) {
        if(!this.disabled) {
            e.stopPropagation();
            e.preventDefault();
        }
    }
    
    onDragOver(e) {
        if(!this.disabled) {
            this.dragHighlight = true;
            e.stopPropagation();
            e.preventDefault();
        }
    }
    
    onDragLeave(e) {
        if(!this.disabled) {
            this.dragHighlight = false;
        }
    }
    
    onDrop(e) {
        if(!this.disabled) {
            e.stopPropagation();
            e.preventDefault();
            
            this.onFileSelect(e);
        }
    }
    
    formatSize(bytes) {
        if(bytes == 0) {
            return '0 B';
        }
        let k = 1000,
        dm = 3,
        sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

@NgModule({
    imports: [CommonModule,ButtonModule,ProgressBarModule,MessagesModule],
    exports: [FileUpload,ButtonModule,ProgressBarModule,MessagesModule],
    declarations: [FileUpload]
})
export class FileUploadModule { }