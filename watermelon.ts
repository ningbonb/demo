/*
* //依赖 matter.js ，需全局引入：https://github.com/liabru/matter-js
* 预览：https://go.163.com/f2e/20210219_matter/index.html
* 使用方法：
import MatterClass from './watermelon.ts';
const matterObj = new MatterClass({
    canvas: document.getElementById('canvas'), // canvas 元素
    assets: ['../assets/0.png',...], // 纹理合集
    gameOverCallback: ()=>{ // 游戏结束回调
        
    }
});
*/

const Engine = window['Matter'].Engine,
    Render = window['Matter'].Render,
    World = window['Matter'].World,
    Bodies = window['Matter'].Bodies,
    Body = window['Matter'].Body,
    MouseConstraint = window['Matter'].MouseConstraint,
    Sleeping = window['Matter'].Sleeping,
    Events = window['Matter'].Events;

const psdWidth = 750,
    canvasHeight = window.innerHeight * psdWidth / window.innerWidth,
    radius = [52/2, 80/2, 108/2, 118/2, 152/2, 184/2, 194/2, 258/2, 308/2, 310/2, 408/2];

export default class MatterClass{
    private engine;
    private render;
    private world;
    private circle = null;
    private readonly canvas;
    private circleAmount = 0;
    private readonly assets;
    private readonly gameOverCallback;
    private canPlay:boolean = true;
    constructor(prop) {
        this.canvas = prop.canvas;
        this.assets = prop.assets;
        this.gameOverCallback = prop.gameOverCallback;
        this.init();
        this.addCircle();
        this.addEvents();
    }
    private init(){
        this.engine = Engine.create({
            enableSleeping: true
        });
        this.world = this.engine.world;
        this.world.bounds = { min: { x: 0, y: 0}, max: { x: psdWidth, y: canvasHeight } };
        this.render = Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: psdWidth,
                height: canvasHeight,
                wireframes: false,
                background :"#ffe89d",
                showSleeping: false,
            },
        });

        const ground = Bodies.rectangle(psdWidth / 2, canvasHeight - 120 / 2, psdWidth, 120, { isStatic: true,
            render: {
                fillStyle: '#7b5438',
            }
        });
        const leftWall = Bodies.rectangle(-10/2, canvasHeight/2, 10, canvasHeight, { isStatic: true });
        const rightWall = Bodies.rectangle(10/2 + psdWidth, canvasHeight/2, 10, canvasHeight, { isStatic: true });
        World.add(this.world, [ground, leftWall, rightWall]);

        Engine.run(this.engine);
        Render.run(this.render);
    }
    // 添加球体
    private addCircle(){
        const radiusTemp = radius.slice(0, 6);
        const index = this.circleAmount === 0 ? 0 : (Math.random() * radiusTemp.length | 0);
        const circleRadius = radiusTemp[index];
        this.circle = Bodies.circle(psdWidth /2, circleRadius + 30, circleRadius, {
                isStatic: true,
                restitution: 0.2,
                render: {
                    sprite: {
                        texture: this.assets[index],
                    }
                }
            }
        );
        World.add(this.world, this.circle);
        this.gameProgressChecking(this.circle);
        this.circleAmount++;
    }
    // 添加事件
    private addEvents(){
        const mouseconstraint = MouseConstraint.create(this.engine);
        Events.on(mouseconstraint, "mousemove", (e)=>{
            if(!this.circle || !this.canPlay) return;
            this.updateCirclePosition(e);
        })
        Events.on(mouseconstraint, "mouseup", (e)=>{
            if(!this.circle || !this.canPlay) return;
            this.updateCirclePosition(e);
            Sleeping.set(this.circle, false);
            Body.setStatic(this.circle, false );
            this.circle = null;
            setTimeout(()=>{
                this.addCircle();
            }, 1000);
        });

        Events.on(this.engine, "collisionStart", e => this.collisionEvent(e));
        Events.on(this.engine, "collisionActive", e => this.collisionEvent(e));
    }
    private collisionEvent(e){
        if(!this.canPlay) return;
        const { pairs } = e;
        Sleeping.afterCollisions(pairs);
        for(let i = 0; i < pairs.length; i++ ){
            const {bodyA, bodyB} = pairs[i];
            if(bodyA.circleRadius && bodyA.circleRadius == bodyB.circleRadius){
                const { position: { x: bx, y: by }, circleRadius, } = bodyA;
                const { position: { x: ax, y: ay } } = bodyB;

                const x = (ax + bx) / 2;
                const y = (ay + by) / 2;

                const index = radius.indexOf(circleRadius)+1;

                const circleNew = Bodies.circle(x, y, radius[index],{
                    restitution: 0.2,
                    render: {
                        sprite: {
                            texture: this.assets[index],
                        }
                    }
                });

                World.remove(this.world, bodyA);
                World.remove(this.world, bodyB);
                World.add(this.world, circleNew);
                this.gameProgressChecking(circleNew);
            }
        }
    }
    private updateCirclePosition(e){
        const xTemp = e.mouse.absolute.x * psdWidth / window.innerWidth;
        const radius = this.circle.circleRadius;
        Body.setPosition(this.circle, {x: xTemp < radius ? radius : xTemp + radius > psdWidth ? psdWidth - radius : xTemp, y: radius + 30});
    }
    private gameProgressChecking(body){
        Events.on(body, 'sleepStart', (event)=> {
            if (!event.source.isStatic && event.source.position.y <= 300) {
                this.gameOver();
            }
        })
    }
    private gameOver(){
        this.canPlay = false;
        this.gameOverCallback();
    }
}
