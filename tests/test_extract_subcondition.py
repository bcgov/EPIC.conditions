import pytest
import json
from gpt import extract_subcondition

condition_text_3= """Where a condition of this EA  Certificate  requires the Holder to consult particular party or 
parties regarding the content of a management plan, the Holder must:  
a) Provide written notice to each such party that:  
i) includes a copy of the management plan;  
ii) invites the party to provide its views on the content of such management 
plan; and  
iii) indicates:  
i. if a timeframe providing such views to the Holder is specified in the 
relevant condition of this EA  Certificate , that the party may provide 
such views to the Holder within such time frame; or  
ii. if a timeframe providing such views to the Holder is not specified in 
the relevant condition of this EA  Certificate , specifies a reasonable 
period during which the party may submit such views to the Holder;  
b) Undertake a full and impartial consideration of any views and ot her information 
provided by a party in accordance with the timelines specified in a notice given 
pursuant to paragraph (a);  
c) Provide a written explanation to each party that provided comments in accordance 
with a notice given pursuant to paragraph (a) as t o: 
i) how the views and information provided by such party to the Holder 
received have been considered and addressed in a revised version of the 
management plan; or  
ii) why such views and information have not been addressed in a revised 
version of the management plan;  
d) Maintain a record of consultation with each such party regarding the management 
plan; and   
5 
 e) Provide a copy of such consultation record to the EAO, the relevant party, or both, 
promptly upon the written request of the EAO or such party.
The Holder must prepare monthly reports on the Holder’s compliance with this Certificate.
These reports must be retained by the Holder through the Construction phase of the
Project and for five years after commencing Operations."""

@pytest.mark.extract_subcondition
def test_extract_subcondition_eelgrass():

    # open json from ../test_documents
    with open('test_documents/eelgrass.json') as f:
        conditions_json = json.load(f)


    for condition in conditions_json['conditions']:
        print(json.dumps(condition['condition_name'], indent=4))

    assert(True) # Finish this test

    # print conditions_json

    # convert json to string
    # conditions_json_string = json.dumps(conditions_json)

    # subconditions = extract_subcondition(condition_text_3)

    # print("YOOO")


    # assert isinstance(subconditions, str)
