﻿import * as alt from '@altv/client';
import Scaleform from '../utils/Scaleform.js';

export default class Message {
    private static _messageVisible: boolean = false;
    private static _transitionOutTimeout: alt.Timers.Timeout = null;
    private static _transitionOutFinishedTimeout: alt.Timers.Timeout = null;
    private static _delayedTransitionInTimeout: alt.Timers.Timeout = null;
    private static _scaleform: Scaleform = null;
    private static _transitionOutTimeMs: number = 500;
    private static _transitionOutAnimName: string = null;

    protected static Initialize(scaleForm: string, transitionOutAnimName: string) {
        this._transitionOutAnimName = transitionOutAnimName;
        this._scaleform = new Scaleform(scaleForm);
    }

    public static get IsVisible(): boolean {
        return this._messageVisible;
    }

    protected static get Scaleform(): Scaleform {
        return this._scaleform;
    }

    private static Load() {
        //Make sure there is no delayed transition existing
        if (this._delayedTransitionInTimeout != null) {
            this._delayedTransitionInTimeout.destroy();
            this._delayedTransitionInTimeout = null;
        }
    }

    //Delayed transition is needed when transition out got played before, this is the case when bigmessage is called before other one is finished showing.
    private static SetDelayedTransition(messageHandler: { (): void }, time: number) {
        this._delayedTransitionInTimeout = alt.Timers.setTimeout(() => {
            this._delayedTransitionInTimeout = null;
            this.TransitionIn(messageHandler, time);
        }, this._transitionOutTimeMs);
    }

    public static ShowCustomShard(funcName: string, time: number = 5000, ...funcArgs: any[]): void {
        this.ShowComplexCustomShard(() => {
            this._scaleform.callFunction(funcName, ...funcArgs);
        }, time);
    }

    public static ShowComplexCustomShard(messageHandler: { (): void }, time: number = 5000): void {
        this.Load();
        if (this._messageVisible) { //When a shard is already shown
            this.TransitionOut();
            this.SetDelayedTransition(() => messageHandler(), time);
        }
        else {
            this.TransitionIn(messageHandler, time);
        }
    }

    protected static TransitionOut() {
        if (!this._messageVisible)
            return;
        if (this._transitionOutTimeout != null) {
            this._transitionOutTimeout.destroy();
            this._transitionOutTimeout = null;
        }
        if (this._transitionOutFinishedTimeout != null) {
            this._transitionOutFinishedTimeout.destroy();
            this._transitionOutFinishedTimeout = null;
        }
        this._scaleform.callFunction(this._transitionOutAnimName);
        this._transitionOutFinishedTimeout = alt.Timers.setTimeout(() => {
            this._messageVisible = false;
            this._scaleform.recreate();
        }, this._transitionOutTimeMs);
    }

    private static TransitionIn(messageHandler: { (): void }, transitionOutTime: number = 500) {
        this._messageVisible = true;
        messageHandler();
        this.SetTransitionOutTimer(transitionOutTime);
    }

    private static SetTransitionOutTimer(time: number) {
        this._transitionOutTimeout = alt.Timers.setTimeout(() => {
            this._transitionOutTimeout = null;
            this.TransitionOut();
        }, time);
    }

    protected static Render() {
        if (this._messageVisible) {
            this._scaleform.render2D();
        }
    }
}