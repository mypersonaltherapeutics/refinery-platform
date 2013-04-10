/*
 * solr_facet_view.js
 *  
 * Author: Nils Gehlenborg 
 * Created: 9 April 2013
 *
 * A facet-based analysis selection control that operates on a SolrQuery. 
 */


/*
 * Dependencies:
 * - JQuery
 * - SolrQuery
 * - AnalysisApiClient
 */

SOLR_FACET_SELECTION_UPDATED_COMMAND = 'solr_analysis_facet_selection_updated';
SOLR_FACET_SELECTION_CLEARED_COMMAND = 'solr_analysis_facet_selection_cleared';

SolrAnalysisFacetView = function( parentElementId, idPrefix, solrQuery, configurator, dataSetUuid, commands ) {
  	
  	var self = this;
	
	// parent element for UI 
  	self._parentElementId = parentElementId;
  	
  	// id prefix for all DOM elements to create unique element ids
  	self._idPrefix = idPrefix;
  	
  	// Solr interaction 
  	self._query = solrQuery;
  	
  	// data set configuration
  	self._configurator = configurator;
  	
  	// wreqr commands
  	self._commands = commands;
  	
  	self._expandedFacets = [];
  	
  	self._hiddenFieldNames = [ "uuid", "file_uuid", "study_uuid", "assay_uuid", "type", "is_annotation", "species", "genome_build", "name" ]; // TODO: make these regexes;
  	
  	self._analysisApiClient = new AnalysisApiClient( dataSetUuid, "analysis-manager-controls", REFINERY_API_BASE_URL, crsf_token );
	//self._analysisApiClient.initialize();
	
	/*
	analysisApiClient.setChangeAnalysisCallback( function( analysisList ) {
		alert( "Changed analysis selection" + " = " + analysisList.length() );
	});
	*/	 
};	
	
	
SolrAnalysisFacetView.prototype.initialize = function() {
	var self = this;

	return this;	
};
	
	
/*
 * Render the user interface components into element defined by self.elementId.
 */
SolrAnalysisFacetView.prototype.render = function ( solrResponse ) {
	var self = this;
	
	// clear parent element
	$( "#" + self._parentElementId ).html("");
	
	$( "#" + self._parentElementId ).append( "<a id=\"clear-facets\" href=\"#\" class=\"btn btn-mini\" data-placement=\"bottom\" data-html=\"true\" rel=\"tooltip\" data-original-title=\"Click to clear facet selection.\"><i class=\"icon-remove-sign\"></i>&nbsp;&nbsp;Reset All</a><br>&nbsp;<br>" );
   	
   	$( "#clear-facets" ).click( function( event ) {
		// clear facet selection
		var counter = self._query.clearFacetSelection();
		
		self._query.clearDocumentSelection();
		
		// reload page
		if ( counter > 0 ) {
   			self._commands.execute( SOLR_FACET_SELECTION_CLEARED_COMMAND );   						
		}
   	});				
			
	self._renderTree( solrResponse );
	
	//$( "#" + self.parentElementId ).html( code );		
	
	// attach event listeners
	// ..
};


SolrAnalysisFacetView.prototype._renderTree = function( solrResponse ) {
	
	var self = this;

	var tree = self._generateTree( solrResponse );
		
	// attach events
	// ..
   	$(".facet-value").on( "click", function( event ) {
   		event.preventDefault();
   		   	
   		var facetValueId = this.id;
   		var facet = self._decomposeFacetValueId( facetValueId ).facet;
   		var facetValue = self._decomposeFacetValueId( facetValueId ).facetValue;
   	   		
   		self._query._facetSelection[facet][facetValue].isSelected = !self._query._facetSelection[facet][facetValue].isSelected;
   		
		self._query.clearDocumentSelection();
   		
   		self._commands.execute( SOLR_FACET_SELECTION_UPDATED_COMMAND, { 'facet': facet, 'facet_value': facetValue, 'isSelected': self._query._facetSelection[facet][facetValue].isSelected } );   		
   	} );	
}
	
	
SolrAnalysisFacetView.prototype._generateTree = function( solrResponse ) {
	var self = this;			
	var facetCounts = solrResponse._facetCounts;

	for ( var i = 0; i < configurator.state.objects.length; ++i ) {
		var attribute = configurator.state.objects[i];
		
	
		if ( attribute.is_facet && attribute.is_exposed && !attribute.is_internal ) {
			//facets[attribute.solr_field] = [];
			
			var counts = self._query.getNumberOfFacetValues( attribute.solr_field );
			var countsString = ""; //"(" + counts.total + ")";
			
			$('<div/>', {
				'href': '#' + self._composeFacetId( attribute.solr_field + "___inactive" ),
				'class': 'refinery-facet-title',
				'data-toggle': "collapse",
				'data-parent': "#" + self._parentElementId,
				//'data-parent': self._parentElementId,
				'data-target': "#" + self._composeFacetId( attribute.solr_field + "___inactive" ),
				'id': self._composeFacetId( attribute.solr_field ),
				'html': '<span class="refinery-facet-label" id="' + self._composeFacetId( attribute.solr_field + '___label' ) + '">' + self._getFacetLabel( attribute.solr_field ) + '</span>'
				}).appendTo('#' + self._parentElementId);
			
			// only show active facet values when facet is collapsed
			$('<div/>', { 'class': 'facet-value-list selected ' + ( self._isFacetExpanded( attribute.solr_field ) ? 'hidden' : '' ), "id": self._composeFacetId( attribute.solr_field + "___active" ), html: "" }).appendTo('#' + self._parentElementId);											
			
			// if facet is marked as expanded display it that way
			$('<div/>', { 'class': 'facet-value-list collapse ' + ( self._isFacetExpanded( attribute.solr_field ) ? 'in' : '' ), "id": self._composeFacetId( attribute.solr_field + "___inactive" ), html: "" }).appendTo('#' + self._parentElementId);
	
			// user chooses to open collapsed facet
		   	$("#" + self._composeFacetId( attribute.solr_field + "___inactive" ) ).on( "show", function() {
		   		var facet = self._decomposeFacetId( this.id ).facet;
				
				// add facet to list of expanded facets for this view
		   		self._setFacetExpanded( facet );
		   		
		   		// update facet label (i.e. show downward pointing triangle before label)
				$( "#" + self._composeFacetId( facet + '___label' ) ).html( self._getFacetLabel( facet ) );
				
				// hide active facet section (to avoid showing duplicate facet values)
		   		$( "#" + self._composeFacetId( facet + "___active" ) ).hide(); //slideUp( "slow" );		   			
		   	});						
	
			// user chooses to close expanded facet
		   	$("#" + self._composeFacetId( attribute.solr_field + "___inactive" ) ).on( "hide", function() {
		   		var facet = self._decomposeFacetId( this.id ).facet;
		   		
				// remove facet from list of expanded facets for this view
		   		self._setFacetCollapsed( facet );
		   		
		   		// update facet label (i.e. show triangle pointing to the right before label)		   		
				$( "#" + self._composeFacetId( facet + '___label' ) ).html( self._getFacetLabel( facet ) );
		   		
				// show active facet section
	   			$( "#" + self._composeFacetId( facet + "___active" ) ).removeClass( "hidden" );
	   			$( "#" + self._composeFacetId( facet + "___active" ) ).fadeIn( "slow" ); //slideDown( "slow");
		   	});
		}											
	}	

	for ( var facet in facetCounts ) {
		if ( facetCounts.hasOwnProperty( facet ) ) {
			var unselectedItems = [];
			var selectedItems = [];
			
			var facetValues = facetCounts[facet];
			
			for ( var facetValue in facetValues ) {
				if ( facetValues.hasOwnProperty( facetValue ) ) {
					
					var facetValueCount = facetValues[facetValue];
					
					if ( ( facetValue === "" ) || ( facetValue === undefined ) ) {
						facetValue = "undefined";
					}

					
					if ( self._query._facetSelection[facet][facetValue] === undefined ) {					
						self._query._facetSelection[facet][facetValue] = { count: 0, isSelected: false };
					}

					if ( self._query._facetSelection[facet][facetValue].isSelected ) {						
						self._query._facetSelection[facet][facetValue] = { count: facetValueCount, isSelected: self._query._facetSelection[facet][facetValue].isSelected };
						
			    		selectedItems.push("<tr class=\"facet-value\" id=\"" + self._composeFacetValueId( facet, facetValue ) + "\"><td>" + '<label class="checkbox"><input type="checkbox" checked></label>' + "</td><td width=100%>" + facetValue + "</td><td align=right>" + facetValueCount + "</td>"  + "</tr>" );					
		    			unselectedItems.push("<tr class=\"facet-value\" id=\"" + self._composeFacetValueId( facet, facetValue ) + "\"><td>" + '<label class="checkbox"><input type="checkbox" checked></label>' + "</td><td width=100%>" + facetValue + "</td><td align=right>" + facetValueCount + "</td>"  + "</tr>" );
					}
					else {
						self._query._facetSelection[facet][facetValue] = { count: facetValueCount, isSelected: self._query._facetSelection[facet][facetValue].isSelected };
						
						unselectedItems.push("<tr class=\"facet-value\" id=\"" + self._composeFacetValueId( facet, facetValue ) + "\"><td>" + '<label class="checkbox"><input type="checkbox"></label>' + "</td><td width=100%>" + facetValue + "</td><td align=right>" + facetValueCount + "</td><td></td>"  + "</tr>" );									
					}										
				}			
			}
			
			$( "#" + self._composeFacetId( facet + "___active" ) ).html( "<table class=\"\"><tbody>" + selectedItems.join('') + "</tbody></table>" ); 
			$( "#" + self._composeFacetId( facet + "___inactive" ) ).html( "<table class=\"\"><tbody>" + unselectedItems.join('') + "</tbody></table>" );
		}		
    }
}

SolrAnalysisFacetView.prototype._getFacetLabel = function( facet ) {	
	var self = this;
	
	var indicator = ""
	
	if ( self._isFacetExpanded( facet ) ) {
		indicator = "icon-caret-down";
	}
	else {
		indicator = "icon-caret-right";
	}
	
	return ( '<span style="width: 10px; text-align: center; display: inline-block;"><i class="' + indicator + '"></i></span>&nbsp;' + prettifySolrFieldName( facet, true ) );	
}

SolrAnalysisFacetView.prototype._toggleExpandedFacet = function( facet ) {	
	var self = this;
	
	var index = self._expandedFacets.indexOf( facet );
	
	if ( index >= 0 ) {
		self._expandedFacets.splice( index, 1 );
	}
	else {
		self._expandedFacets.push( facet );
	}	
}

SolrAnalysisFacetView.prototype._setFacetExpanded = function( facet ) {	
	var self = this;
	
	var index = self._expandedFacets.indexOf( facet );
	
	if ( index < 0 ) {
		self._expandedFacets.push( facet );
	}	
}

SolrAnalysisFacetView.prototype._setFacetCollapsed = function( facet ) {	
	var self = this;
	
	var index = self._expandedFacets.indexOf( facet );
	
	if ( index >= 0 ) {
		self._expandedFacets.splice( index, 1 );
	}	
}



SolrAnalysisFacetView.prototype._isFacetExpanded = function( facet ) {
	var self = this;
	
	return ( self._expandedFacets.indexOf( facet ) >= 0 );	
}


SolrAnalysisFacetView.prototype._composeFacetValueId = function( facet, facetValue ) {
	var self = this;
	return ( self._idPrefix + "___" + "facetvalue" + "___" + facet + "___" + facetValue );
}

SolrAnalysisFacetView.prototype._decomposeFacetValueId = function( facetValueId ) {
	var self = this;
	return ( { facet: facetValueId.split( "___" )[2], facetValue: facetValueId.split( "___" )[3] } );
}

SolrAnalysisFacetView.prototype._composeFacetId = function( facet ) {
	var self = this;
	return ( self._idPrefix + "___" + "facet" + "___" + facet );
}

SolrAnalysisFacetView.prototype._decomposeFacetId = function( facetId ) {
	var self = this;
	return ( { facet: facetId.split( "___" )[2] } );
}
