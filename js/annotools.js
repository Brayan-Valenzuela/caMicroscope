var color='lime';
var ratio=0.005;//One pixel equals to the length in real situation
var maxWidth=4000;
var maxHeight=800;
var annotools = new Class({
    initialize: function(element,options){
        this.source = element;
        this.left=options.left|| '0px';
        this.top=options.top|| '0px';
        this.height=options.height||'20px';
        this.width=options.width|| '160px';
        this.zindex=options.zindex|| '100';
        this.canvas=options.canvas;
        this.annotations=options.annot||[];
        this.annotationVisible=true;
        this.mode='default';
	window.addEvent("domready",this.createButtons.bind(this));
        window.addEvent("keydown",function(event){this.keyPress(event.code)}.bind(this));
    },
    createButtons:function()
    {
        this.tool=document.id(this.source);
        this.tool.setStyles({'position':'absolute','left':this.left,'top':this.top,'width':this.width,'height':this.height,'z-index':this.zindex});
        this.tool.addClass('annotools');
        this.tool.makeDraggable();
	this.rectbutton=new Element('img',{'title':'rectangle','class':'toolButton','src':'images/rect.svg'}).inject(this.tool);
	this.ellipsebutton=new Element('img',{'title':'ellipse','class':'toolButton','src':'images/ellipse.svg'}).inject(this.tool);
	this.polybutton=new Element('img',{'title':'polyline','class':'toolButton','src':'images/poly.svg'}).inject(this.tool);
	this.pencilbutton=new Element('img',{'title':'pencil','class':'toolButton','src':'images/pencil.svg'}).inject(this.tool);
	this.colorbutton=new Element('img',{'title':'Change Color','class':'toolButton','src':'images/color.svg'}).inject(this.tool);
	this.measurebutton=new Element('img',{'title':'measure','class':'toolButton','src':'images/measure.svg'}).inject(this.tool);
	this.magnifybutton=new Element('img',{'title':'magnify','class':'toolButton','src':'images/magnify.svg'}).inject(this.tool);
	this.hidebutton=new Element('img',{'title':'hide','class':'toolButton','src':'images/hide.svg'}).inject(this.tool);
        var toolButtons=document.getElementsByClassName("toolButton");
        for(var i=0;i<toolButtons.length;i++)
        {
            toolButtons[i].addEvents({'mouseenter':function(){this.addClass('selected')},'mouseleave':function(){this.removeClass('selected')}});
        }
        this.rectbutton.addEvents({'click':function(){this.mode='rect';this.showMessage();this.drawMarkups();}.bind(this)});
        this.ellipsebutton.addEvents({'click':function(){this.mode='ellipse';this.showMessage();this.drawMarkups();}.bind(this)});
        this.polybutton.addEvents({'click':function(){this.mode='polyline';this.showMessage();this.drawMarkups();}.bind(this)});
        this.pencilbutton.addEvents({'click':function(){this.mode='pencil';this.showMessage();this.drawMarkups();}.bind(this)});
        this.measurebutton.addEvents({'click':function(){this.mode='measure';this.showMessage();this.drawMarkups();}.bind(this)});
        this.magnifybutton.addEvents({'click':function(){this.mode='magnify';this.showMessage();this.magnify();}.bind(this)});
        this.colorbutton.addEvents({'click':function(){this.selectColor()}.bind(this)});
        this.hidebutton.addEvents({'click':function(){this.toggleMarkups()}.bind(this)});
        this.messageBox=new Element('div',{'id':'messageBox'}).inject(document.body);
        this.showMessage("Press white space to toggle editing tool");
    },
    keyPress:function(code)
    {
        console.log(code);
        switch (code)
        {
           case 65://press a to toggle annotations
	   this.toggleMarkups();
           break;
           case 81://press q to quit any mode
           this.quitMode();
           break;
           case 32://press white space to toggle tools
           this.tool.toggle();
           break;
	   case 49://1 for rectangle mode
           this.mode='rect';this.showMessage();this.drawMarkups();
           break;
	   case 50:// 2 for ellipse mode
           this.mode='ellipse';this.showMessage();this.drawMarkups();
           break;
           case 51:// 3 for polyline mode
           this.mode='polyline';this.showMessage();this.drawMarkups();
           break;
           case 52:// 4 for pencil mode
           this.mode='pencil';this.showMessage();this.drawMarkups();
           break;
           case 53:// 5 for measurement mode
           this.mode='measure';this.showMessage();this.drawMarkups();
           break;
           case 54:// 6 for magnify mode
           this.mode='magnify';this.showMessage();this.magnify();
           break;
        }
    },
    drawMarkups:function()
    {
        var container=document.id(this.canvas);
        var left=parseInt(container.offsetLeft),
	   top=parseInt(container.offsetTop),
	   width=parseInt(container.offsetWidth),
	   height=parseInt(container.offsetHeight),
	   oleft=left,
	   otop=top,
	   owidth=width,
	   oheight=height;
	 if (left<0){left=0;width=window.innerWidth;}
	 if (top<0){top=0;height=window.innerHeight;}
	 if($("magnify")) $("magnify").destroy();
         if($("createlayer"))
	 {
		//Remove Events and Destroy the Create Layer
		$("myCanvas").removeEvent('mousedown');
		$("myCanvas").removeEvent('mouseup');
		$("myCanvas").removeEvent('mousemove');
	  	$("createlayer").destroy();
	 }
	 var layer=new Element('div',{id:"createlayer",html:"",styles:{position:'absolute','z-index':1,left:left,top:top}}).inject(document.body);
	   //Create Canvas on the Layer
         var canvas=new Element('canvas',{id:"myCanvas",width:width,height:height}).inject(layer);
	 var ctx=canvas.getContext("2d");
	   //Draw Markups on Canvas
	   switch (this.mode)
	  {
	      case "rect":
	      //Draw Rectangles
	      var started=false;
	      var x,//start location x
		  y,//start location y
		  w,//width
		  h;//height
	      canvas.addEvent('mousedown',function(e){started=true;x=e.event.offsetX;y=e.event.offsetY;});
	      canvas.addEvent('mousemove',function(e){ 
	      if(started){
		  ctx.clearRect(0,0,canvas.width,canvas.height);
		  x=Math.min(e.event.offsetX,x);
		  y=Math.min(e.event.offsetY,y);
		  w=Math.abs(e.event.offsetX-x);
		  h=Math.abs(e.event.offsetY-y);
		  ctx.strokeStyle = color;
		  ctx.strokeRect(x,y,w,h);
	    	}
	      });
	      canvas.addEvent('mouseup',function(e){
		started= false;
		//Save the Percentage Relative to the Picture
		x=(x+left-oleft)/owidth;
		y=(y+top-otop)/oheight;
		w=w/owidth;
		h=h/oheight;
		var tip=prompt("Please Enter Some Descriptions","");
		if (tip!=null)
		{
		        //Update Annotations
                        var newAnnot= {x:x,y:y,w:w,h:h,type:"rect",text:tip,color:color};
			this.updateAnnot(newAnnot);
                        this.drawMarkups();
		}
                else{ ctx.clearRect(0,0,canvas.width,canvas.height);}
	     }.bind(this));
	     break;
             case "ellipse":
	     //Draw Ellipse
	     var started=false;
	     var x,//start location x
		  y,//start location y
		  w,//width
		  h;//height
	     canvas.addEvent('mousedown',function(e){started=true;x=e.event.offsetX;y=e.event.offsetY;});
	     canvas.addEvent('mousemove',function(e){ 
	     if(started){
		ctx.clearRect(0,0,canvas.width,canvas.height);
		x=Math.min(e.event.offsetX,x);
		y=Math.min(e.event.offsetY,y);
		w=Math.abs(e.event.offsetX-x);
		h=Math.abs(e.event.offsetY-y);
		var kappa = .5522848;
		var ox = (w / 2) * kappa; // control point offset horizontal
		var oy = (h / 2) * kappa; // control point offset vertical
		var xe = x + w;          // x-end
		var ye = y + h;           // y-end
		var xm = x + w / 2;      // x-middle
		var ym = y + h / 2;       // y-middle
		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		ctx.closePath();
		ctx.strokeStyle = color;
		ctx.stroke();
	    	}
	     });
	     canvas.addEvent('mouseup',function(e){
		started= false;
		//Save the Percentage Relative to the Picture
		x=(x+left-oleft)/owidth;
		y=(y+top-otop)/oheight;
		w=w/owidth;
		h=h/oheight;
		var tip=prompt("Please Enter Some Descriptions","");
		if (tip!=null)
		{
		        //Update Annotations
			var newAnnot= {x:x,y:y,w:w,h:h,type:"ellipse",text:tip,color:color};
			this.updateAnnot(newAnnot);
                        this.drawMarkups();
		}
                else{ ctx.clearRect(0,0,canvas.width,canvas.height);}
	     }.bind(this));
	     break;
	     case "pencil":
	     //Draw Pencil
	     var started=false;
	     var pencil=[];//The Pencil Object
	     var newpoly=[];//Every Stroke is treated as a Continous Polyline
	     canvas.addEvent('mousedown',function(e){ 
		started=true;
		newpoly.push( {"x":e.event.offsetX,"y":e.event.offsetY});//The percentage will be saved
		ctx.beginPath();
		ctx.moveTo(e.event.offsetX, e.event.offsetY);
		ctx.strokeStyle = color;
		ctx.stroke();
	     });
	     canvas.addEvent('mousemove',function(e){ 
	       if(started)
	       {
		     newpoly.push( {"x":e.event.offsetX,"y":e.event.offsetY});
		     ctx.lineTo(e.event.offsetX,e.event.offsetY);
		     ctx.stroke();
		}
	      });
	     canvas.addEvent('mouseup',function(e){ 
		started=false;
		pencil.push(newpoly);//Push the Stroke to the Pencil Object
		newpoly=[];//Clear the Stroke
		numpoint=0;//Clear the Points
		var tip=prompt("Please Enter Some Descriptions","");
		var x,y,w,h;
		x=pencil[0][0].x;
		y=pencil[0][0].y;
		var maxdistance=0;
		var points="";
		for (var i=0;i<pencil.length;i++)
		{
		    newpoly=pencil[i];
		    for(j=0;j<newpoly.length;j++)
		    {
		   	 points+=(newpoly[j].x+left-oleft)/owidth+','+(newpoly[j].y+top-otop)/oheight+' ';
		         if (((newpoly[j].x-x)*(newpoly[j].x-x)+(newpoly[j].y-y)*(newpoly[j].y-y))>maxdistance)
		         {
		             maxdistance=((newpoly[j].x-x)*(newpoly[j].x-x)+(newpoly[j].y-y)*(newpoly[j].y-y));
		             w=Math.abs(newpoly[j].x-x)/owidth;
		             h=Math.abs(newpoly[j].y-y)/oheight;
		         }
		    }
		    points=points.slice(0, -1)
		    points+=';';
		} 
		points=points.slice(0,-1);
		x=(x+left-oleft)/owidth;
		y=(y+top-otop)/oheight;
		if (tip!=null)
		{
			var newAnnot={x:x,y:y,w:w,h:h,type:"pencil",points:points,text:tip,color:color}; 
			this.updateAnnot(newAnnot);
                        this.drawMarkups();
		}
                else{ ctx.clearRect(0,0,canvas.width,canvas.height);}
	     }.bind(this));
	     break;
	     case "polyline":
		//Create Polylines
		var newpoly=[];//New Polyline
		var numpoint=0;//Number of Points
		canvas.addEvent('mousedown',function(e){ 
	   	ctx.fillStyle=color;
		ctx.beginPath();
		ctx.arc(e.event.offsetX,e.event.offsetY,2,0,Math.PI*2,true);
		ctx.closePath();
		ctx.fill();
		newpoly.push( {"x":e.event.offsetX,"y":e.event.offsetY});
		if(numpoint>0)
		{
			ctx.beginPath();
			ctx.moveTo(newpoly[numpoint].x, newpoly[numpoint].y);
			ctx.lineTo(newpoly[numpoint-1].x, newpoly[numpoint-1].y);
			ctx.strokeStyle = color;
			ctx.stroke();
		}
		numpoint++;
		});
		canvas.addEvent('dblclick',function(e){
		ctx.beginPath();
		ctx.moveTo(newpoly[numpoint-1].x, newpoly[numpoint-1].y);
		ctx.lineTo(newpoly[0].x, newpoly[0].y);
		ctx.strokeStyle = color;
		ctx.stroke();
		var x,y,w,h;
		x=newpoly[0].x;
		y=newpoly[0].y;
		var maxdistance=0;
		var tip=prompt("Please Enter Some Descriptions","");
		var points="";
		for (var i=0;i<numpoint-1;i++)
		{
		   points+=(newpoly[i].x+left-oleft)/owidth+','+(newpoly[i].y+top-otop)/oheight+' ';
	 	   if (((newpoly[i].x-x)*(newpoly[i].x-x)+(newpoly[i].y-y)*(newpoly[i].y-y))>maxdistance)
		         {
		             maxdistance=((newpoly[i].x-x)*(newpoly[i].x-x)+(newpoly[i].y-y)*(newpoly[i].y-y));
		             w=Math.abs(newpoly[i].x-x)/owidth;
		             h=Math.abs(newpoly[i].y-y)/oheight;
		         }

		} 
		points+=(newpoly[i].x+left-oleft)/owidth+','+(newpoly[i].y+top-otop)/oheight;
		x=(x+left-oleft)/owidth;
		y=(y+top-otop)/oheight;
		if(tip!=null)
		{
			var newAnnot={x:x,y:y,w:w,h:h,type:"polyline",points:points,text:tip,color:color}; 
			this.updateAnnot(newAnnot);
                        this.drawMarkups();
		}
                else{ ctx.clearRect(0,0,canvas.width,canvas.height);}
	       }.bind(this));
	     break;
	     case "measure":
	     var started=false;
	     var x0,y0,x1,y1;
	     var length;
	     var ruler=new Element('div',{id:'ruler',styles:{background:'black',position:'absolute',color:'white',width:'200px'}});;
	     canvas.addEvent('mousedown',function(e){ 
	       if (!started)
	       {
			x0=e.event.offsetX;
			y0=e.event.offsetY;
		        started=true;
		        ruler.inject(iip.canvas);
	       }
	       else
	       {
			x1=e.event.offsetX;
			y1=e.event.offsetY;
			ctx.beginPath();
			ctx.moveTo(x0, y0);
			ctx.lineTo(x1, y1);
			ctx.strokeStyle = color;
			ctx.stroke();
		        ctx.closePath();
			var tip=prompt("Save This?",length);
	 		if(tip!=null)
	    	        {
				x=(x0+left-oleft)/owidth;
		       	        y=(y0+top-otop)/oheight;
		                w=Math.abs(x1-x0)/owidth;
		                h=Math.abs(y1-y0)/oheight;
		                points=(x1+left-oleft)/owidth+","+(y1+top-otop)/oheight;
				var newAnnot={x:x,y:y,w:w,h:h,type:"line",points:points,text:tip,color:color}; 
				this.updateAnnot(newAnnot);
                                this.drawMarkups();
	     		}
               	        else{ ctx.clearRect(0,0,canvas.width,canvas.height);}
		        started=false;
			$("ruler").destroy();
		}
	    }.bind(this));
	    canvas.addEvent('mousemove',function(e){ 
	       if ( started)
	       {
		  	ctx.clearRect(0,0,iip.wid,iip.hei);
			x1=e.event.offsetX;
			y1=e.event.offsetY;
		        var maxLength=(Math.sqrt(maxWidth*maxWidth+maxHeight*maxHeight));
		        var screen=(Math.sqrt(owidth*owidth+oheight*oheight));
			length=((Math.sqrt((x0-x1)*(x0-x1)+(y0-y1)*(y0-y1)))/screen)*maxLength*ratio+'mm';
		        ruler.set({html:length,styles:{left:x1+left-oleft+10,top:y1+top-otop}});
			ctx.beginPath();
			ctx.moveTo(x0, y0);
			ctx.lineTo(x1, y1);
			ctx.strokeStyle = color;
			ctx.stroke();
		        ctx.closePath();
		        
	       }
	    });
	    break;
	}
    },
    magnify:function()
   {
	   if($("magnify")) $("magnify").destroy();
           if($("createlayer"))
	   {
		//Remove Events and Destroy the Create Layer
		$("myCanvas").removeEvent('mousedown');
		$("myCanvas").removeEvent('mouseup');
		$("myCanvas").removeEvent('mousemove');
	  	$("createlayer").destroy();
	   }
	   var magnify=new Element('div',{id:"magnify",'class':"magnify"});
	   var content=new Element('div',{'class':"magnified_content",styles:{width:document.getSize().x,height:document.getSize().y}});
	   content.set({html:document.body.innerHTML});
	   content.inject(magnify);
	   magnify.inject(document.body);
	   magnify.makeDraggable({
	   onDrag: function(draggable){
		var left=parseInt(magnify.style.left);
		var top=parseInt(magnify.style.top);
		var scale=2.0;
		magnify.set({'styles':{left:left,top:top}});
		content.set({'styles':{left:-scale*left,top:-scale*top}});
	    },
	    onDrop: function(draggable){
	    }
	  });
    },
    selectColor:function()
    {
      
	if($("color")) $("color").destroy();
	var colorContainer=new Element('div',{id:'color'}).inject(this.tool);
        var blackColor=new Element('img',{'class':'colorButton','title':'black',	
				'styles':{'background-color':'black'},
				'events':{
                                           'click':function(){color='black';$("color").destroy();}
					 }}).inject(colorContainer);
	var redColor=new Element('img',{'class':'colorButton','title':'Default',
				'styles':{'background-color':'red'},
				'events':{
                                           'click':function(){color='red';$("color").destroy();}
					 }}).inject(colorContainer);
	var blueColor=new Element('img',{'class':'colorButton','title':'blue',	
				'styles':{'background-color':'blue'},
				'events':{
                                           'click':function(){color='blue';$("color").destroy();}
					 }}).inject(colorContainer);
	var greenColor=new Element('img',{'class':'colorButton','title':'lime',	
				'styles':{'background-color':'lime'},
				'events':{
                                           'click':function(){color='lime';$("color").destroy();}
					 }}).inject(colorContainer);
	var purpleColor=new Element('img',{'class':'colorButton','title':'purple',	
				'styles':{'background-color':'purple'},
				'events':{
                                           'click':function(){color='purple';$("color").destroy();}
					 }}).inject(colorContainer);
	var orangeColor=new Element('img',{'class':'colorButton','title':'orange',	
				'styles':{'background-color':'orange'},
				'events':{
                                           'click':function(){color='orange';$("color").destroy();}
					 }}).inject(colorContainer);
	var yellowColor=new Element('img',{'class':'colorButton','title':'yellow',	
				'styles':{'background-color':'yellow'},
				'events':{
                                           'click':function(){color='yellow';$("color").destroy();}
					 }}).inject(colorContainer);
	var pinkColor=new Element('img',{'class':'colorButton','title':'pink',	
				'styles':{'background-color':'pink'},
				'events':{
                                           'click':function(){color='pink';$("color").destroy();}
					 }}).inject(colorContainer);
	var colorButtons=document.getElementsByClassName("colorButton");
        for(var i=0;i<colorButtons.length;i++)
        {
            colorButtons[i].addEvents({'mouseenter':function(){this.addClass('selected')},'mouseleave':function(){this.removeClass('selected')}});
        }
        
	},
        updateAnnot:function(newAnnot)
        {
		this.annotations.push(newAnnot); 
		saveAnnotations(1,this.annotations);
                this.displayAnnot();
        },
        quitMode:function()
        {
	   if($("magnify")) $("magnify").destroy();
           if($("createlayer"))
	   {
		//Remove Events and Destroy the Create Layer
		$("myCanvas").removeEvent('mousedown');
		$("myCanvas").removeEvent('mouseup');
		$("myCanvas").removeEvent('mousemove');
	  	$("createlayer").destroy();
	   }
        },
        toggleMarkups:function()
        {
           if(this.svg) this.svg.toggle();
           else this.displayAnnot();
           this.showMessage("annotation toggled");
	},
        showMessage:function(msg)
        {
               if(!(msg)) msg=this.mode+" mode,press q to quit";
               $("messageBox").set({html:msg});
		var myFx = new Fx.Tween('messageBox', {
		    duration: 'long',
		    transition: 'bounce:out',
		    link: 'cancel',
		    property: 'opacity'
		}).start(0,1).chain(
   		 function(){ this.start(0.5,0); });
        },
        displayAnnot:function()
        {
            var a = [], b;
            var container=document.id(this.canvas);
            var left=parseInt(container.offsetLeft),
	    top=parseInt(container.offsetTop),
	    width=parseInt(container.offsetWidth),
	    height=parseInt(container.offsetHeight);
	    if($("createlayer")) $("createlayer").destroy();
 	    if($("magnify")) $("magnify").destroy();
            for (b in this.annotations) this.annotations[b].id = b, a.push(this.annotations[b]);
               //This part is for displaying SVG annotations
                if(this.annotationVisible)
               {
		var svgHtml='<svg xmlns="http://www.w3.org/2000/svg" version="1.1">';
                for (b = 0; b < a.length; b++) 
                {
		    switch (a[b].type)
		    {
			  case "rect":
			  svgHtml+='<rect x="'+width*a[b].x+'" y="'+height*a[b].y+'" width="'+width*a[b].w+'" height="'+height*a[b].h+'" stroke="'+a[b].color+'" stroke-width="2" fill="none"/>';
			  break;
			  case "ellipse":
		          var cx=parseFloat(a[b].x)+parseFloat(a[b].w)/2;
			  var cy=parseFloat(a[b].y)+parseFloat(a[b].h)/2;
			  var rx=parseFloat(a[b].w)/2;
			  var ry=parseFloat(a[b].h)/2;
			  svgHtml+='<ellipse cx="'+width*cx+'" cy="'+height*cy+'" rx="'+width*rx+'" ry="'+height*ry+'" style="fill:none;stroke:'+a[b].color+';stroke-width:2"/>';
                          break;
			  case "pencil":
	 		  var points=a[b].points;
			  var poly=String.split(points,';');
			  for (var k=0;k<poly.length;k++)
			  {
			     var p=String.split(poly[k],' ');
			     svgHtml+='<polyline points="';         
		             for (var j=0;j<p.length;j++)
		             {
				  point=String.split(p[j],',');
				  px=point[0]*width;
				  py=point[1]*height;
				  svgHtml+=px+','+py+' ';
		             }
			     svgHtml+='" style="fill:none;stroke:'+a[b].color+';stroke-width:2"/>';
			  }
			  break;
			  case "polyline":
 			  var points=a[b].points;
			  var poly=String.split(points,';');
			  for (var k=0;k<poly.length;k++)
			  {
			     var p=String.split(poly[k],' ');
			     svgHtml+='<polygon points="';         
		             for (var j=0;j<p.length;j++)
		             {
				  point=String.split(p[j],',');
				  px=point[0]*width;
				  py=point[1]*height;
				  svgHtml+=px+','+py+' ';
		             }
			     svgHtml+='" style="fill:none;stroke:'+a[b].color+';stroke-width:2"/>';
			  }
			  break;
                          case "line":
                          var points=String.split(a[b].points,',');
                          svgHtml+='<line x1="'+a[b].x*width+'" y1="'+a[b].y*height+'" x2="'+parseFloat(points[0])*width+'" y2="'+parseFloat(points[1])*height+'" style="stroke:'+a[b].color+';stroke-width:2"/>';
			  break;
		    }
                }
		 svgHtml+='</svg>';
                 //inject the SVG Annotations to this.Canvas
           	 this.svg = (new Element("div", {
                 styles: {
                     position:"absolute",
                     left: 0,
                     top: 0,
                     width: '100%',
                     height: '100%'
                   },
	     	   html:svgHtml
	        })).inject(container);
            }
	},
        displayTip:function(b)
        { 
              console.log(b);
        }        
});



