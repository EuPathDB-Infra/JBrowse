define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'JBrowse/Util',
    'dojo/on',
    'dojo/Deferred',
    'EbrcTracks/View/MultiRectLayoutSynteny',
    'EbrcTracks/View/Track/CanvasSubtracks'
],
function (
    declare,
    array,
    lang,
    domConstruct,
    Util,
    on,
    Deferred,
    MultiRectLayoutSynteny,
    CanvasSubtracks
) {
    return declare(CanvasSubtracks, {
        constructor: function () {
            this.inherited(arguments);
            this.showLabels = false;
        },



        // override getLayout to access addRect method
        _getLayout: function (scale) {
            var thisB = this;
            if( ! thisB.layout || thisB._layoutpitchX != 1/scale ) {
                var pitchY = thisB.getConf('layoutPitchY') || 6;
                thisB.layout = new MultiRectLayoutSynteny({ pitchX: 1/scale, pitchY: pitchY, maxHeight: thisB.getConf('maxHeight'), displayMode: thisB.displayMode, subtracks: thisB.subtracks, geneGroupAttributeName: thisB.getConf('geneGroupAttributeName') });
                thisB._layoutpitchX = 1/scale;
            }
            return this.layout;
        },


        renderAcrossSubtracks: function() {
            var multiLayout = this.layout;

            if(!multiLayout) {
                return;
            }

            var layoutCount = multiLayout.layouts.length;

            var thisB = this;

            var i = 0;
            blockLoop:
            for (i = 0; i < this.blocks.length; i++) { 
                var block = thisB.blocks[i];
                if(!block || !block.featureCanvas) {
                    continue blockLoop;
                }

                var context = block.featureCanvas.getContext('2d');;
                var j = 0;
                // for each layout
                for (j = 0; j < multiLayout.layouts.length; j++) { 
                    var subLayout = multiLayout.layouts[j];

                    var pitchY=  subLayout.pitchY;

                    // get all rectangles for a layout
                    for(var id in subLayout.rectangles) {
                    
                        var rectangle = subLayout.rectangles[id];
                        var geneGroup = subLayout.featureIdMap[id];

                        var k = 0;

                        // look down one layout at a time.  if found one, render the rectangle pairs
                        syntenyPairsLoop:
                        for (k = j+1; k < multiLayout.layouts.length; k++) {
                            var nextLayout = multiLayout.layouts[k];

                            // this happens when there are no features in a sublayout
                            if(!nextLayout.geneGroupMap) {
                                continue syntenyPairsLoop;
                            }

                            var orthologs = nextLayout.geneGroupMap[geneGroup];

                            if(Array.isArray(orthologs) && orthologs.length) {
                                array.forEach(orthologs, function( orthologId ) {
                                    var orthologRectangle = nextLayout.rectangles[orthologId];
                                    //                                    thisB.renderSynteny(rectangle, orthologRectangle);

                                    var fStartX = block.bpToX(rectangle.data.data.start);
//                                    var fStartX = block.bpToX(rectangle.data.get("start"));
                                    var fEndX = block.bpToX(rectangle.data.data.end);
//                                    var fEndX = block.bpToX(rectangle.data.get("end"));
                                    var fY = (rectangle.top * pitchY) + (rectangle.h * pitchY);


                                    var oStartX = block.bpToX(orthologRectangle.data.data.start);
//                                    var oStartX = block.bpToX(orthologRectangle.data.get("start"));
                                    var oEndX = block.bpToX(orthologRectangle.data.data.end);
//                                    var oEndX = block.bpToX(orthologRectangle.data.get("end"));
                                    var oY = orthologRectangle.top * pitchY;

                                    

                                    context.beginPath();
                                    context.moveTo(fStartX, fY);
                                    context.lineTo(fEndX, fY);
                                    context.lineTo(oEndX, oY);
                                    context.lineTo(oStartX, oY);
                                    context.closePath();
                                    context.stroke();
                                    context.fillStyle = "grey";

                                    context.globalAlpha = 0.1;
                                    context.fill();

                                    context.globalAlpha = 1;
                                });
                                break syntenyPairsLoop;
                            }
                        }
                    }
                }
            }

        }

    });
});
