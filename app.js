onError = function(error, statement) {
  alert('Error: ' + error.message + ' when processing ' + statement);
}

deleteEvent = function(id) {
  html5sql.process([{
    'sql': 'DELETE FROM events WHERE id=?',
    'data': [id],
    'success': function(){
      $('#row-'+id).remove();
    }
  }], function(){}, onError);
}

fillTable = function(transaction, results, rowArray) {
  var html = '';
  $.each(rowArray, function(index, value) {
    var reaction = [];
    if(value.waving == "true")
      reaction.push('Waving');
    if(value.ringing == "true")
      reaction.push('Ringing');
    if(value.intLights == "true")
      reaction.push('Interior lights');
    if(value.headlight == "true")
      reaction.push('Headlight');
    if(value.blinkers == "true")
      reaction.push('Blinkers');
    if(value.loudspeakerText != '')
      reaction.push('Loudspeaker ("' + value.loudspeakerText + '")');
    if(value.otherText != '')
      reaction.push(value.otherText);
    if(reaction.length == 0)
      reaction.push('No Reaction');

    html += '<tr id="row-' + value.id + '">' +
      '<td>' + value.time + '</td>' +
      '<td>' + value.number + '</td>' +
      '<td>' + value.line + '</td>' +
      '<td><span class="ui-icon-arrow-' + (value.direction == 'ltr' ? 'r':'l') + ' ui-btn-icon-notext inlineIcon"></span></td>' +
      '<td>' + reaction.join(', ') + '</td>' +
      '<td>' + value.notes + '</td>' +
      '<td><a href="javascript:deleteEvent('+value.id+');" data-rolw="button" class="ui-btn ui-icon-delete ui-btn-icon-notext">Delete</a></td>' +
      '</tr>';
  });
  $('#dataTable tbody').append(html);
  $('#dataTable').table('refresh');
}

reloadTable = function() {
  $('#dataTable tbody').empty();
  html5sql.process('SELECT * FROM events', fillTable, onError);
}

$(document).on('pagecreate', function() {
  if(!html5sql.database) {
    html5sql.openDatabase('com.tram-winken.appdb', 'App Data', 1024*1024);

    html5sql.logInfo = true;
    html5sql.logErrors = true;
    html5sql.putSelectResultsInArray = true;

    html5sql.process('CREATE TABLE IF NOT EXISTS events(id INTEGER NOT NULL, time DATETIME, number INTEGER, line INTEGER, direction VARCHAR(3), waving BOOLEAN, ringing BOOLEAN, intLights BOOLEAN, headlight BOOLEAN, blinkers BOOLEAN, loudspeakerText VARCHAR(256), otherText VARCHAR(256), notes VARCHAR(256), PRIMARY KEY(id));', function(){}, onError);
  }

  reloadTable();

  $('#addDialog').on({
    pagebeforeshow: function() {
      $('#eventForm').trigger('reset');

      var d = new Date();
      var nowString = d.getHours() + ':' + d.getMinutes();
      $('#time').val(nowString);

      $('#loudspeakerText').parent().hide();
      $('#loudspeakerText').click(function(e){e.stopPropagation();});
      $('#loudspeakerText').tap(function(e){e.stopPropagation();});
      $('#loudspeaker').change(function() {
        $('#loudspeakerText').parent().toggle($(this).is(':checked'));
      });
      $('#otherText').parent().hide();
      $('#otherText').click(function(e){e.stopPropagation();});
      $('#otherText').tap(function(e){e.stopPropagation();});
      $('#other').change(function() {
        $('#otherText').parent().toggle($(this).is(':checked'));
      });

      $('#number').on('keyup change paste click', function() {
        html5sql.process([{
          'sql': 'SELECT * FROM events WHERE number=? ORDER BY id DESC LIMIT 1',
          'data': [$('#number').val()],
          'success': function(transaction, results, rowArray) {
            if(rowArray.length > 0)
            {
              $('#line').val(rowArray[0].line);
              if(rowArray[0].direction == 'rtl') {
                $('#ltr').prop('checked', true);
                $('#rtl').prop('checked', false);
              }
              else {
                $('#rtl').prop('checked', true);
                $('#ltr').prop('checked', false);
              }
              $('input[type="radio"]').checkboxradio('refresh');
            }
          }}], function(){}, onError);
      });

      $('#submit').unbind('click').click(function(event) {
        var time = $('#time').val();
        var number = $('#number').val();
        var line = $('#line').val();
        var number = $('#number').val();
        var direction = 'rtl';
        if($('#ltr').is(':checked'))
          var direction = 'ltr';
        var waving = $('#waving').is(':checked');
        var ringing = $('#ringing').is(':checked');
        var intLights = $('#intLights').is(':checked');
        var headlight = $('#headlight').is(':checked');
        var blinkers = $('#blinkers').is(':checked');
        var loudspeakerText = '';
        if($('#loudspeaker').is(':checked'))
          loudspeakerText = $('#loudspeakerText').val();
        var otherText = '';
        if($('#other').is(':checked'))
          otherText = $('#otherText').val();
        var notes = $('#notes').val();

        html5sql.process([{
          'sql': 'INSERT INTO events(time, number, line, direction, waving, ringing, intLights, headlight, blinkers, loudspeakerText, otherText, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
          'data': [time, number, line, direction, waving, ringing, intLights, headlight, blinkers, loudspeakerText, otherText, notes],
          'success': function(){}
        }], reloadTable, onError);
      });
    }
  });
});
