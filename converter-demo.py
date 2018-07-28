#!/usr/bin/env python3
# -*- coding: UTF-8 -*-

# Copyright (C) 2018 Eddie Antonio Santos <easantos@ualberta.ca>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.


import json

from quart import Quart, websocket, render_template
from crk_orthography import (
    sro2syllabics, syllabics2sro, __version__ as library_version
)

app = Quart(__name__)


@app.route('/')
async def hello():
    return await render_template('index.html',
                                 library_version=library_version)


@app.websocket('/ws')
async def ws():
    while True:
        data = await websocket.receive()
        await websocket.send(handle_request(data))


def jsonify(fn):
    def wrapped(raw_data, *args, **kwargs):
        parsed_data = json.loads(raw_data)
        raw_response = fn(parsed_data, *args, **kwargs)
        return json.dumps(raw_response)
    return wrapped


@jsonify
def handle_request(data):
    if 'sro' in data:
        return {'syl': sro2syllabics(data['sro'])}
    elif 'syl' in data:
        return {'sro': syllabics2sro(data['syl'])}
    else:
        return {'error': 'invalid request'}


if __name__ == '__main__':
    app.run()