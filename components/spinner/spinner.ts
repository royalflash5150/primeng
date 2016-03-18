import {Component,ElementRef,OnInit,Input,Output,EventEmitter} from 'angular2/core';
import {InputText} from '../inputtext/inputtext';

@Component({
    selector: 'p-spinner',
    template: `
        <span class="ui-spinner ui-widget ui-corner-all" [ngClass]="{'ui-state-disabled':disabled}">
            <input #in id="basic" pInputText type="text" class="ui-spinner-input" [value]="value === 0 ? 0 : value||''"
            [attr.size]="size" [attr.maxlength]="maxlength" [attr.readonly]="readonly" [attr.disabled]="disabled"
            (keydown)="onInputKeydown($event)" (input)="onInput($event)">
            <a class="ui-spinner-button ui-spinner-up ui-corner-tr ui-button ui-widget ui-state-default ui-button-text-only"
                [ngClass]="{'ui-state-hover':hoverUp,'ui-state-active':activeUp}"
                (mouseenter)="hoverUp=true" (mouseleave)="onUpButtonMouseleave($event)" (mousedown)="onUpButtonMousedown($event,in)" (mouseup)="onUpButtonMouseup($event)">
                <span class="ui-button-text">
                    <span class="fa fa-fw fa-caret-up"></span>
                </span>
            </a>
            <a class="ui-spinner-button ui-spinner-down ui-corner-br ui-button ui-widget ui-state-default ui-button-text-only"
                [ngClass]="{'ui-state-hover':hoverDown,'ui-state-active':activeDown}"
                (mouseenter)="hoverDown=true" (mouseleave)="onDownButtonMouseleave($event)" (mousedown)="onDownButtonMousedown($event,in)" (mouseup)="onDownButtonMouseup($event)">
                <span class="ui-button-text">
                    <span class="fa fa-fw fa-caret-down"></span>
                </span>
            </a>
        </span>
    `,
    directives: [InputText]
})
export class Spinner implements OnInit {

    @Input() value: number;
    
    @Output() valueChange: EventEmitter<any> = new EventEmitter();

    @Input() step: number = 1;

    @Input() min: number;

    @Input() max: number;
    
    @Input() maxlength: number;
    
    @Input() size: number;

    @Input() disabled: boolean;
    
    @Input() readonly: boolean;
    
    private hoverUp: boolean;
    
    private activeUp: boolean;
    
    private hoverDown: boolean;
    
    private activeDown: boolean;

    private precision: number;
    
    private timer: any;
    
    ngOnInit() {
        if(Math.floor(this.step) === 0) {
            this.precision = this.step.toString().split(/[,]|[.]/)[1].length;
        }
    }
    
    repeat(interval, dir) {
        let i = interval||500;

        this.clearTimer();
        this.timer = setTimeout(() => {
            this.repeat(40, dir);
        }, i);

        this.spin(dir);
    }
    
    spin(dir: number) {
        let step = this.step * dir;
        let currentValue = this.value||0;
        let newValue = null;
        
        if(this.precision)
            this.value = parseFloat(this.toFixed(currentValue + step, this.precision));
        else
            this.value = currentValue + step;
    
        if(this.max !== undefined && this.value.toString().length > this.maxlength) {
            this.value = currentValue;
        }
    
        if(this.min !== undefined && this.value < this.min) {
            this.value = this.min;
        }

        if(this.max !== undefined && this.value > this.max) {
            this.value = this.max;
        }
        
        this.valueChange.next(this.value); 
    }
    
    toFixed(value: number, precision: number) {
        let power = Math.pow(10, precision||0);
        return String(Math.round(value * power) / power);
    }
    
    onUpButtonMousedown(event,input) {
        input.focus();
        this.activeUp = true;
        this.repeat(null, 1);
        
        event.preventDefault();
    }
    
    onUpButtonMouseup(event) {
        this.activeUp = false;
        this.clearTimer();
    }
    
    onUpButtonMouseleave(event) {
        this.hoverUp = false;
        this.activeUp = false;
        this.clearTimer();
    }
    
    onDownButtonMousedown(event,input) {
        input.focus();
        this.activeDown = true;
        this.repeat(null, -1);
        
        event.preventDefault();
    }
    
    onDownButtonMouseup(event) {
        this.activeDown = false;
        this.clearTimer();
    }
    
    onDownButtonMouseleave(event) {
        this.hoverDown = false;
        this.activeDown = false;
        this.clearTimer();
    }
    
    onInputKeydown(event) {  
        if(event.which == 38) {
            this.spin(1);
            event.preventDefault();
        }
        else if(event.which == 40) {
            this.spin(-1);
            event.preventDefault();
        }    
    }
    
    onInput(event) {
        this.value = this.parseValue(event.target.value);
        event.target.value = this.value;
        
        this.valueChange.next(this.value);
    }
    
    parseValue(val: string): number {
        let value: number;
        if(val.trim() === '') {
            value= this.min !== undefined ? this.min : null;
        }
        else {        
            if(this.precision)
                value = parseFloat(val);
            else
                value = parseInt(val);
                            
            if(!isNaN(value)) {
                if(this.max !== undefined && value > this.max) {
                    value = this.max;
                }
                
                if(this.min !== undefined && value < this.min) {
                    value = this.min;
                }
            }
            else {
                value = null;
            }
        }
        
        return value;
    }
        
    clearTimer() {
        if(this.timer) {
            clearInterval(this.timer);
        }
    }
    
}