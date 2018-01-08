#! env/bin/python
# -*- coding: utf-8 -*-

"""
IMDBnator core renaming script.
Usage:
    parser.py (imdb | tmdb) (movies | tv) (FILE) (DIRECTORY) [--quiet | --verbose]
"""

import os
import sys
import shutil
import json
import docopt

reload(sys)
sys.setdefaultencoding('utf8')

args = docopt.docopt(__doc__)
dump = os.path.abspath(args['FILE'])
save = os.path.abspath(args['DIRECTORY'])

# Define field properties that will be indexed by elasticsearch
fields = {
    'imdb': {
        'movies': ["imdbID", "Title", "Year", "imdbRating", "imdbVotes", "Runtime", "Language", "Country", "Poster", "Type"],
        'tv': []
    },
    'tmdb': {
        'movies': ['id', 'imdb_id', 'original_language', 'original_title', 'popularity', 'poster_path', 'backdrop_path', 'release_date', 'title', 'vote_average', 'vote_count', 'alternative_titles', 'belongs_to_collection', ],
        'tv': ['id','original_name', 'original_language', 'popularity','poster_path', 'backdrop_path', 'first_air_date', 'last_air_date', 'name', 'vote_average', 'vote_count', 'alternative_titles', 'number_of_seasons', 'number_of_episodes','external_ids']
    }
}


# Check if dump file exists
if not os.path.isfile(dump):
    print "%s does not exist." % (dump)
    sys.exit(0)

# Check if a directory is provided
if not os.path.isdir(save):
    os.makedirs(save)

# Update status on console
print 'Processing ...'

# Check what kind of dump the file is
sanitized_file = os.path.join(save, os.path.basename(dump) + '.sanitized')
titles_file = os.path.join(save, os.path.basename(dump) + '.titles')

if args['imdb']:
    with open(dump, 'r+') as fh1, open(sanitized_file, 'w+') as fh2, open(titles_file, 'w+') as fh3:
        for i,line in enumerate(fh1):
            try:
                # Save valid JSON lines to new file
                fh2.write(line)

                # Process json for titles and Save
                row = json.loads(line)
                if args['movies']:
                    newrow = {x: row[x] for x in row if x in fields['imdb']['movies']}
                fh3.write(json.dumps(newrow) + '\n')
            except:
                pass

if args['tmdb']:
    with open(dump, 'r+') as fh1, open(sanitized_file, 'w+') as fh2, open(titles_file, 'w+') as fh3:
        for i,line in enumerate(fh1):
            try:
                # Save valid JSON lines to new file
                fh2.write(line)

                # Process json for titles and Save
                row = json.loads(line)
                if args['movies']:
                    newrow = {x: row[x] for x in row if x in fields['tmdb']['movies']}
                    newrow['release_date'] = int(newrow['release_date'][:4]) if (newrow['release_date']) else None
                    for title in newrow['alternative_titles']['titles']:
                        iso_3166_1 = title['iso_3166_1'].replace(" ", "_").lower()
                        newrow['alternative_title_' + iso_3166_1] = title['title']
                    del newrow['alternative_titles']
                if args['tv']:
                    newrow = {x: row[x] for x in row if x in fields['tmdb']['tv']}
                    newrow['last_air_date'] = int(newrow['last_air_date'][:4]) if (newrow['last_air_date']) else None
                    newrow['first_air_date'] = int(newrow['first_air_date'][:4]) if (newrow['first_air_date']) else None
                    for title in newrow['alternative_titles']['results']:
                        iso_3166_1 = title['iso_3166_1'].replace(" ", "_").lower()
                        newrow['alternative_title_' + iso_3166_1] = title['title']
                    del newrow['alternative_titles']
                fh3.write(json.dumps(newrow) + '\n')
                continue
            except:
                pass
print "Done"
