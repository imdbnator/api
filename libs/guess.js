function guess (movie) {
    /* var details = {
        "input": "NA",
        "title": "NA",
        "year": "NA",
        "type": "movie",
        "ext": "NA",
        "screen_size": "NA",
        "format": "NA",
        "videoCodec": "NA",
        "videoProfile": "NA",
        "audioCodec": "NA",
        "audioChannels": "NA",
        "audioProfile": "NA",
        "other": "NA",
        "releaseGroup": "NA",
        "website": "NA",
        "imdbid": "NA",
        "status": "true"
    }; */

  var details = {}

  details.input = movie

  var imdbPatt = /tt\d{7}/i
  var imdbBool = imdbPatt.test(movie)

  if (imdbBool) {
    details.imdbid = movie.match(imdbPatt)[0]
    return details
  }

    // date pattern

  var datePatt = /(19|20)[0-9][0-9]/i
  var dateBool = datePatt.test(movie)

  if (dateBool) {
    details.year = movie.match(datePatt)[0]
  }

    // season and episode details

  var seriesPatt1 = /(.*)S(\d{1,2})E(\d{1,2})(.*)/i
  var seriesBool1 = seriesPatt1.test(movie)
  var seriesPatt2 = /(.*)(\d{1,2})x(\d{1,3})(.*)/i
  var seriesBool2 = seriesPatt2.test(movie)

  if (seriesBool1) {
    details.seasonNumber = movie.match(seriesPatt1)[2]
    details.episodeNumber = movie.match(seriesPatt1)[3]
    details.type = 'series'
  }

  if (seriesBool2) {
    details.season = movie.match(seriesPatt2)[2]
    details.episode = movie.match(seriesPatt2)[3]
    details.type = 'series'
  }

    // episode details

  var epiDetPatt = /\b(Bonus|Oav|Ova|Omake|Extras|Unaired|Special|Pilot)\b/ig

  var epiDetPattBool = epiDetPatt.test(movie)
  if (epiDetPattBool) {
    details.episodeDetails = movie.match(epiDetPatt)[0]
  }

    // extension pattern

  var extPatt = /\.(3g2|wmv|webm|mp4|avi|mp4a|mpeg|sub|mka|m4v|ts|mkv|ra|rm|wma|ass|mpg|ram|3gp|ogv|mov|ogm|asf|divx|ogg|ssa|qt|idx|nfo|wav|flv|3gp2|iso|mk2|srt)$/ig
  var extBool = extPatt.test(movie)

  if (extBool) {
    details.ext = movie.match(extPatt)[0]
    movie = movie.replace(extPatt, ' ')
  }

    // screen size

  var screenPatt = /720p|1080p|1080i|\d{3,4}x\d{3,4}|4K|360p|368p|480p|576p|900p/ig
  var screenBool = screenPatt.test(movie)

  if (screenBool) {
    details['screen_size'] = movie.match(screenPatt)[0]
    movie = movie.replace(screenPatt, ' ')
  }

    // video format

  var formatPatt1 = /CAMRip|DVDSCR|DVDRip|DVDR|DVDSCREENER|HDTV|HDTVRip|HDCam|HDRip|WEBDL|WEB-DL|WEB-Rip|WEBRip|BDRip|BRRip|Blu-Ray|BluRay|BRRip|BR-RIP|BRR|TELESYNCSCR|SCREENER|BDR|BDSCR|DDC|R5.LINE|R5.AC3.5.1.HQDVD-Full|Full-Rip|ISOrip|DVD-5|DVD-9|DSR|DSRip|DTHRip|DVBRip|PDTV|TVRip|VODRip|VODR|WEB-Cap|WEBCAP|BD5|BD9|BD25|BD50|R5|PDVD|WORKPRINT|TELECINE|PPV|PPVRip|losslessrip|untouchedrip/ig
  var formatPatt2 = /\b(CAM|TS|WP|TC)\b/ig

  var formatBool1 = formatPatt1.test(movie)
  var formatBool2 = formatPatt2.test(movie)

  if (formatBool1) {
    details['format'] = movie.match(formatPatt1)[0]
    movie = movie.replace(formatPatt1, ' ')
  }
  if (formatBool2) {
    details['format'] = movie.match(formatPatt2)[0]
    movie = movie.replace(formatPatt2, ' ')
  }
    // video codec

  var vcodecPatt = /x264|DivX|XviD|Mpeg2|h264|h265/ig
  var vcodecBool = vcodecPatt.test(movie)

  if (vcodecBool) {
    details.videoCodec = movie.match(vcodecPatt)[0]
    movie = movie.replace(vcodecPatt, ' ')
  }

    // audio codec

  var acodecPatt = /\b(AAC\d*|AC3|MP3|MP4|DTS|TrueHD|DolbyDigital|Flac)\b/ig
  var acodecBool = acodecPatt.test(movie)

  if (acodecBool) {
    details.audioCodec = movie.match(acodecPatt)[0]
    movie = movie.replace(acodecPatt, ' ')
  }

    // video profile

  var vprofilePatt = /\b(8bit|10bit|HP|BP|MP|XP|Hi422P|Hi444PP)\b/ig
  var vprofileBool = vprofilePatt.test(movie)

  if (vprofileBool) {
    details.videoProfilec = movie.match(vprofilePatt)[0]
    movie = movie.replace(vprofilePatt, ' ')
  }

    // audio profile

  var aprofilePatt = /\b(LC|HQ|HD|HE|HDMA)\b/ig
  var aprofileBool = aprofilePatt.test(movie)

  if (aprofileBool) {
    details.audioProfile = movie.match(aprofilePatt)[1]
    movie = movie.replace(aprofilePatt, ' ')
  }

    // audio channel

  var achannelPatt = /\b(1\.0|2\.0|5\.1|7\.1)\b/ig
  var achannelBool = achannelPatt.test(movie)

  if (achannelBool) {
    details.audioChannel = movie.match(achannelPatt)[0]
    movie = movie.replace(achannelPatt, ' ')
  }

    // other

  var otherPatt = /\b(Uncut|Director Cut|Director's Cut|Director-Cut|Director's-Cut|Fansub|HR|HQ|Netflix|Screener|Preair|Unrated|HD|mHD|HDLight|3D|SyncFix|Bonus|WideScreen|Fastsub|R5|AudioFix|DDC|Trailer|Complete|Extended|Limited|Classic|Proper|DualAudio|LiNE|Remux|PAL|SECAM|NTSC|Duology|Duo|Trilogy|Trio|Repack)\b/ig
  var otherBool = otherPatt.test(movie)

  if (otherBool) {
    details.other = movie.match(otherPatt)[0]
    movie = movie.replace(otherPatt, ' ')
  }

    // remove website

  var webPatt = /\b(?:http:\/\/)?(?:www\.)?([^\s\[\]\(\)\{\}_.-]*\.(?:com|org|net|info|biz|ws|us|co\.uk|uk|ru|rs|ro|in|co\.in|io|eu|cz|co|ch|cd|cc|ca|bz|ac))\b/ig
  var webBool = webPatt.test(movie)

  if (webBool) {
    details.website = movie.match(webPatt)[0]
    movie = movie.replace(webPatt, ' ')
  }

    // filtering and searching

    // if date match & not in the beginning => get title

  var firstDatePatt = /.{2,}(19|20)[0-9][0-9]/i
  var secondDatePatt = /(.+?)(19|20)[0-9][0-9](.*)/i
  var splCharsWithoutSome = /[_\/\\#+()$~%.*<>{}\[\]]/g // Using this filter for special characters in title
  var splChars = /[&_\-\/\\#,+()$~%.:*?<>{}\[\]]/g

  if (firstDatePatt.test(movie)) {
    var dateMatcher = movie.match(secondDatePatt)
    var dateMatch = dateMatcher[1]
    details.releaseGroup = dateMatcher[3].replace(splChars, ' ').replace(/\s+/g, ' ').trim()
    details.title = dateMatch.replace(splCharsWithoutSome, ' ').replace(/\s+/g, ' ').trim()
  } else {
    details.title = movie.replace(splChars, ' ').replace(/\s+/g, ' ').trim()
  }
  details.title = wordUpperCase(details.title)

    // episodes bool cases check

  return details
}

function wordUpperCase (str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

module.exports = guess
